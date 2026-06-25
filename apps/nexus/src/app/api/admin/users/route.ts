import { randomBytes } from "node:crypto";
import { prisma } from "@orma/database";
import { fail, ok, paginationParams } from "@/lib/api-response";
import { hashPassword, requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createUserSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  await requirePermission("user.read");
  const url = new URL(request.url);
  const pagination = paginationParams(url.searchParams);

  const where = pagination.q
    ? {
        OR: [
          { name: { contains: pagination.q, mode: "insensitive" as const } },
          { email: { contains: pagination.q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        mustChangePassword: true,
        primaryBirdepId: true,
        createdAt: true,
        roles: { include: { role: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return ok({ items, total, page: pagination.page, pageSize: pagination.pageSize });
}

export async function POST(request: Request) {
  const session = await requirePermission("user.create");
  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input user tidak valid.", 400, parsed.error.flatten());
  }

  const temporaryPassword = randomBytes(9).toString("base64url");
  const roles = await prisma.role.findMany({
    where: { code: { in: parsed.data.roleCodes as never[] } },
  });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hashPassword(temporaryPassword),
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      primaryBirdepId: parsed.data.primaryBirdepId,
      memberId: parsed.data.memberId,
      roles: {
        create: roles.map((role) => ({ roleId: role.id })),
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      roles: { include: { role: true } },
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    after: user,
  });

  return ok({ user, temporaryPassword }, { status: 201 });
}
