import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      primaryBirdepId: true,
      mustChangePassword: true,
      member: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!user) {
    return fail("UNAUTHORIZED", "Sesi tidak valid.", 401);
  }

  return ok({
    ...user,
    roles: session.roles,
    permissions: session.permissions,
  });
}
