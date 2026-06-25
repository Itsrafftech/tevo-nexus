import { prisma } from "@orma/database";
import { fail, ok, paginationParams } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { memberSchema } from "@/lib/validations/core";

export async function GET(request: Request) {
  await requireAuth();
  const pagination = paginationParams(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where: { archivedAt: null },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { fullName: "asc" },
      include: { memberships: { include: { primaryBirdep: true } } },
    }),
    prisma.member.count({ where: { archivedAt: null } }),
  ]);
  return ok({ items, total, page: pagination.page, pageSize: pagination.pageSize });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session.permissions.includes("member.create.own_birdep") && !session.permissions.includes("member.manage.all")) {
    return fail("FORBIDDEN", "Tidak punya akses membuat anggota.", 403);
  }

  const parsed = memberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input anggota tidak valid.", 400, parsed.error.flatten());
  }

  const cabinet = await prisma.cabinetPeriod.findFirstOrThrow({ where: { isActive: true } });
  const member = await prisma.member.create({
    data: {
      fullName: parsed.data.fullName,
      nim: parsed.data.nim,
      instagram: parsed.data.instagram,
      memberships: {
        create: {
          cabinetPeriodId: cabinet.id,
          primaryBirdepId: parsed.data.primaryBirdepId,
          organizationalPosition: parsed.data.organizationalPosition as never,
          internalTitle: parsed.data.internalTitle,
          publicTitle: parsed.data.publicTitle,
          subdivision: parsed.data.subdivision,
        },
      },
    },
    include: { memberships: true },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "member.create",
    entityType: "Member",
    entityId: member.id,
    after: member,
  });

  return ok(member, { status: 201 });
}
