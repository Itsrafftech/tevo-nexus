import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  const birdeps = await prisma.birdep.findMany({
    where: { archivedAt: null },
    orderBy: [{ unitType: "asc" }, { name: "asc" }],
  });
  return ok(birdeps);
}
