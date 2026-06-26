import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await requirePermission("user.read");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      archivedAt: true,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: true,
      primaryBirdepId: true,
      memberId: true,
      lastLoginAt: true,
      failedLoginCount: true,
      createdAt: true,
      updatedAt: true,
      roles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } },
    },
  });

  return user ? ok(user) : fail("NOT_FOUND", "User tidak ditemukan.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requirePermission("user.update");
  const { id } = await params;
  const parsed = updateUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input user tidak valid.", 400, parsed.error.flatten());
  }

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) {
    return fail("NOT_FOUND", "User tidak ditemukan.", 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      isActive: parsed.data.isActive,
      primaryBirdepId: parsed.data.primaryBirdepId,
      memberId: parsed.data.memberId,
    },
  });

  if (parsed.data.roleCodes) {
    const roles = await prisma.role.findMany({
      where: { code: { in: parsed.data.roleCodes as never[] } },
    });
    await prisma.roleAssignment.deleteMany({ where: { userId: id } });
    await prisma.roleAssignment.createMany({
      data: roles.map((role) => ({ userId: id, roleId: role.id })),
      skipDuplicates: true,
    });
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "user.update",
    entityType: "User",
    entityId: id,
    before,
    after: user,
  });

  return ok(user);
}
