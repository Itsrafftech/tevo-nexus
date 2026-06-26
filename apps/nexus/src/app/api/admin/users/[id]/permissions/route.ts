import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { permissionOverrideSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requirePermission("permission.manage");
  const { id } = await params;
  if (session.userId === id) {
    return fail("FORBIDDEN", "User tidak boleh mengubah permission sendiri.", 403);
  }

  const parsed = permissionOverrideSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(
      "BAD_REQUEST",
      "Input permission override tidak valid.",
      400,
      parsed.error.flatten(),
    );
  }

  const permissionCodes = [...parsed.data.grants, ...parsed.data.revokes];
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });
  const byCode = new Map(permissions.map((permission) => [permission.code, permission]));

  for (const code of permissionCodes) {
    if (!byCode.has(code)) {
      return fail("BAD_REQUEST", `Permission tidak ditemukan: ${code}`, 400);
    }
  }

  await prisma.$transaction([
    prisma.userPermissionOverride.deleteMany({ where: { userId: id } }),
    ...parsed.data.grants.map((code) =>
      prisma.userPermissionOverride.create({
        data: {
          userId: id,
          permissionId: byCode.get(code)!.id,
          effect: "GRANT",
        },
      }),
    ),
    ...parsed.data.revokes.map((code) =>
      prisma.userPermissionOverride.create({
        data: {
          userId: id,
          permissionId: byCode.get(code)!.id,
          effect: "REVOKE",
        },
      }),
    ),
  ]);

  await writeAuditLog({
    actorUserId: session.userId,
    action: "user.permissions.override",
    entityType: "User",
    entityId: id,
    after: parsed.data,
  });

  return ok({ userId: id, overrides: parsed.data });
}
