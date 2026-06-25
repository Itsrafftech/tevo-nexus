import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { buildSession, hashPassword, requireAuth, setSession, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const session = await requireAuth();
  const parsed = changePasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input password tidak valid.", 400, parsed.error.flatten());
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return fail("FORBIDDEN", "Password lama tidak sesuai.", 403);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
      temporaryPasswordExpiresAt: null,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "auth.password_changed",
    entityType: "User",
    entityId: user.id,
  });
  await setSession(await buildSession(updatedUser));

  return ok({ changed: true });
}
