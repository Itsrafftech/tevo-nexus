import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  await requirePermission("permission.read");
  const permissions = await prisma.permission.findMany({
    orderBy: [{ group: "asc" }, { code: "asc" }],
  });

  return ok(permissions);
}
