import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  await requirePermission("role.read");
  const roles = await prisma.role.findMany({
    orderBy: { code: "asc" },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  return ok(roles);
}
