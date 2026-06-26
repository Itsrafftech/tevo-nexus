import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ type: string }> };
type NormalizedRow = Record<string, unknown>;

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session.permissions.includes("import.manage")) {
    return fail("FORBIDDEN", "Tidak punya akses commit import.", 403);
  }

  const { type } = await params;
  const { batchId } = await request.json();
  if (typeof batchId !== "string") {
    return fail("BAD_REQUEST", "batchId wajib diisi.", 400);
  }

  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { rows: { orderBy: { rowNumber: "asc" } } },
  });

  if (!batch || batch.type !== type) {
    return fail("NOT_FOUND", "Batch import tidak ditemukan.", 404);
  }

  if (batch.rows.some((row) => !row.isValid)) {
    return fail("CONFLICT", "Batch masih memiliki baris invalid.", 409);
  }

  const cabinet = await prisma.cabinetPeriod.findFirstOrThrow({
    where: { isActive: true },
  });

  let affectedRows = 0;
  if (type === "birdeps") {
    affectedRows = await commitBirdeps(cabinet.id, batch.rows);
  } else if (type === "members") {
    affectedRows = await commitMembers(cabinet.id, batch.rows);
  } else if (type === "press-releases") {
    affectedRows = await commitPressReleases(cabinet.id, batch.rows, session.userId);
  } else {
    return fail("BAD_REQUEST", "Tipe import tidak didukung.", 400);
  }

  const updated = await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      dryRun: false,
      status: "COMMITTED",
      committedAt: new Date(),
      summary: {
        type,
        affectedRows,
        totalRows: batch.rows.length,
      },
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "import.commit",
    entityType: "ImportBatch",
    entityId: batchId,
    after: updated.summary,
  });

  return ok({ batch: updated, affectedRows });
}

async function commitBirdeps(cabinetPeriodId: string, rows: { normalizedData: unknown }[]) {
  let affectedRows = 0;
  for (const row of rows) {
    const data = row.normalizedData as NormalizedRow;
    const code = String(data.code ?? "").trim();
    const name = String(data.name ?? "").trim();
    const slug = slugify(code || name);
    await prisma.birdep.upsert({
      where: { cabinetPeriodId_code: { cabinetPeriodId, code } },
      update: {
        name,
        slug,
        description: String(data.description ?? ""),
        focusArea: String(data.focusArea ?? ""),
      },
      create: {
        cabinetPeriodId,
        code,
        name,
        slug,
        unitType: code.toUpperCase() === "BPH" ? "BPH" : "DEPARTEMEN",
        description: String(data.description ?? ""),
        focusArea: String(data.focusArea ?? ""),
      },
    });
    affectedRows += 1;
  }
  return affectedRows;
}

async function commitMembers(cabinetPeriodId: string, rows: { normalizedData: unknown }[]) {
  let affectedRows = 0;
  for (const row of rows) {
    const data = row.normalizedData as NormalizedRow;
    const birdepName = String(data.birdep ?? "").trim();
    const birdep = await findBirdep(cabinetPeriodId, birdepName);
    if (!birdep) continue;

    const formalPosition = String(data.formalPosition ?? "");
    const member = await prisma.member.upsert({
      where: { nim: String(data.nim) },
      update: {
        fullName: String(data.fullName),
        instagram: nullableString(data.instagram),
      },
      create: {
        fullName: String(data.fullName),
        nim: String(data.nim),
        instagram: nullableString(data.instagram),
      },
    });

    await prisma.membership.upsert({
      where: {
        memberId_cabinetPeriodId: {
          memberId: member.id,
          cabinetPeriodId,
        },
      },
      update: {
        primaryBirdepId: birdep.id,
        organizationalPosition: mapOrganizationalPosition(formalPosition),
        subdivision: nullableString(data.subdivision),
        programRoles: nullableString(data.programRole),
      },
      create: {
        memberId: member.id,
        cabinetPeriodId,
        primaryBirdepId: birdep.id,
        organizationalPosition: mapOrganizationalPosition(formalPosition),
        subdivision: nullableString(data.subdivision),
        programRoles: nullableString(data.programRole),
      },
    });

    affectedRows += 1;
  }
  return affectedRows;
}

async function commitPressReleases(
  cabinetPeriodId: string,
  rows: { normalizedData: unknown }[],
  userId: string,
) {
  let affectedRows = 0;
  for (const row of rows) {
    const data = row.normalizedData as NormalizedRow;
    const birdeps = Array.isArray(data.birdeps) ? data.birdeps.map(String) : [];
    const primaryBirdep = await findBirdep(cabinetPeriodId, birdeps[0] ?? "");
    if (!primaryBirdep) continue;

    const programName = String(data.programName ?? "");
    const program = await prisma.programWork.upsert({
      where: {
        cabinetPeriodId_slug: {
          cabinetPeriodId,
          slug: slugify(`${primaryBirdep.code}-${programName}`),
        },
      },
      update: {
        name: programName,
        publicDescription: nullableString(data.description),
        status: String(data.status) as never,
        updatedById: userId,
      },
      create: {
        cabinetPeriodId,
        primaryBirdepId: primaryBirdep.id,
        name: programName,
        slug: slugify(`${primaryBirdep.code}-${programName}`),
        internalDescription: "Imported from TEVO temporary data.",
        publicDescription: nullableString(data.description),
        status: String(data.status) as never,
        startDate: parseDate(data.date),
        endDate: parseDate(data.date),
        createdById: userId,
        updatedById: userId,
      },
    });

    for (const birdepName of birdeps.slice(1)) {
      const collaborator = await findBirdep(cabinetPeriodId, birdepName);
      if (!collaborator) continue;
      await prisma.programCollaborator.upsert({
        where: {
          programId_birdepId: {
            programId: program.id,
            birdepId: collaborator.id,
          },
        },
        update: {},
        create: {
          programId: program.id,
          birdepId: collaborator.id,
        },
      });
    }

    await prisma.pressRelease.upsert({
      where: { programId: program.id },
      update: {
        title: programName,
        sourceType: "GOOGLE_DOCS",
        url: String(data.url ?? ""),
        status: "PUBLISHED",
        publishedAt: parseDate(data.date),
      },
      create: {
        programId: program.id,
        title: programName,
        sourceType: "GOOGLE_DOCS",
        url: String(data.url ?? ""),
        status: "PUBLISHED",
        publishedAt: parseDate(data.date),
        createdById: userId,
      },
    });

    affectedRows += 1;
  }
  return affectedRows;
}

async function findBirdep(cabinetPeriodId: string, value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  return prisma.birdep.findFirst({
    where: {
      cabinetPeriodId,
      OR: [
        { code: { equals: normalized, mode: "insensitive" } },
        { name: { equals: normalized, mode: "insensitive" } },
        { slug: { equals: slugify(normalized), mode: "insensitive" } },
      ],
    },
  });
}

function nullableString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapOrganizationalPosition(value: string) {
  if (value === "Ketua") return "KETUA_ORGANISASI";
  if (value === "Wakil Ketua") return "WAKIL_KETUA_ORGANISASI";
  if (value === "Sekretaris Internal") return "SEKRETARIS_INTERNAL";
  if (value === "Sekretaris Eksternal") return "SEKRETARIS_EKSTERNAL";
  if (value === "Bendahara Internal") return "BENDAHARA_INTERNAL";
  if (value === "Bendahara Eksternal") return "BENDAHARA_EKSTERNAL";
  return "ANGGOTA_BIRDEP";
}
