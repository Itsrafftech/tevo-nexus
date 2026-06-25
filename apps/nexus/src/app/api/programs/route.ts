import { prisma } from "@orma/database";
import { fail, ok, paginationParams } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { programSchema } from "@/lib/validations/core";

export async function GET(request: Request) {
  await requireAuth();
  const pagination = paginationParams(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([
    prisma.programWork.findMany({
      where: { archivedAt: null },
      include: { primaryBirdep: true, collaborators: { include: { birdep: true } } },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.programWork.count({ where: { archivedAt: null } }),
  ]);
  return ok({ items, total, page: pagination.page, pageSize: pagination.pageSize });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session.permissions.includes("program.create.own_birdep") && !session.permissions.includes("program.manage.all")) {
    return fail("FORBIDDEN", "Tidak punya akses membuat program.", 403);
  }

  const parsed = programSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input program tidak valid.", 400, parsed.error.flatten());
  }

  const cabinet = await prisma.cabinetPeriod.findFirstOrThrow({ where: { isActive: true } });
  const program = await prisma.programWork.create({
    data: {
      cabinetPeriodId: cabinet.id,
      primaryBirdepId: parsed.data.primaryBirdepId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      internalDescription: parsed.data.internalDescription,
      publicDescription: parsed.data.publicDescription,
      status: parsed.data.status,
      progressPercent: parsed.data.progressPercent,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      createdById: session.userId,
      updatedById: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "program.create",
    entityType: "ProgramWork",
    entityId: program.id,
    after: program,
  });

  return ok(program, { status: 201 });
}
