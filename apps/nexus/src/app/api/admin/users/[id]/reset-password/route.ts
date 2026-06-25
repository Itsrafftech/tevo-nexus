import { randomBytes } from "node:crypto";
import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { hashPassword, requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requirePermission("user.reset_password");
  const { id } = await params;
  const temporaryPassword = randomBytes(9).toString("base64url");

  const user = await prisma.user.update({
    where: { id },
    data: {
      passwordHash: hashPassword(temporaryPassword),
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return fail("NOT_FOUND", "User tidak ditemukan.", 404);
  }

  await writeAuditLog({
    actorUserId: session.userId,
    action: "user.reset_password",
    entityType: "User",
    entityId: id,
  });

  return ok({ user, temporaryPassword });
}
