import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { buildSession, setSession, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input login tidak valid.", 400, parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email, isActive: true },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });
      await writeAuditLog({
        actorUserId: user.id,
        action: "auth.login_failed",
        entityType: "User",
        entityId: user.id,
      });
    }

    return fail("UNAUTHORIZED", "Email atau password salah.", 401);
  }

  if (
    user.mustChangePassword &&
    user.temporaryPasswordExpiresAt &&
    user.temporaryPasswordExpiresAt < new Date()
  ) {
    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.temporary_password_expired",
      entityType: "User",
      entityId: user.id,
    });
    return fail("UNAUTHORIZED", "Temporary password sudah kedaluwarsa.", 401);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lastLoginAt: new Date(),
    },
  });

  const session = await buildSession(updatedUser);
  await setSession(session);
  await writeAuditLog({
    actorUserId: updatedUser.id,
    action: "auth.login_success",
    entityType: "User",
    entityId: updatedUser.id,
  });

  return ok({
    userId: session.userId,
    roles: session.roles,
    primaryBirdepId: session.primaryBirdepId,
    permissions: session.permissions,
    mustChangePassword: session.mustChangePassword,
  });
}
