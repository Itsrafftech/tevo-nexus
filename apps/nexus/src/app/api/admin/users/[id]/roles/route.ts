import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const rolesSchema = z.object({
  roleCodes: z.array(z.string()).min(1),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await requirePermission("role.assign");
  const { id } = await params;
  if (session.userId === id) {
    return fail("FORBIDDEN", "User tidak boleh mengubah role sendiri.", 403);
  }

  const parsed = rolesSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input role tidak valid.", 400, parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!target) {
    return fail("NOT_FOUND", "User tidak ditemukan.", 404);
  }

  const roles = await prisma.role.findMany({
    where: { code: { in: parsed.data.roleCodes as never[] } },
  });
  if (roles.length !== parsed.data.roleCodes.length) {
    return fail("BAD_REQUEST", "Sebagian role tidak ditemukan.", 400);
  }

  await prisma.roleAssignment.deleteMany({ where: { userId: id } });
  await prisma.roleAssignment.createMany({
    data: roles.map((role) => ({ userId: id, roleId: role.id })),
    skipDuplicates: true,
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "user.roles.replace",
    entityType: "User",
    entityId: id,
    before: target.roles.map((assignment) => assignment.role.code),
    after: roles.map((role) => role.code),
  });

  return ok({ userId: id, roleCodes: roles.map((role) => role.code) });
}
