import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ type: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { type } = await params;
  const { batchId } = await request.json();
  if (typeof batchId !== "string") {
    return fail("BAD_REQUEST", "batchId wajib diisi.", 400);
  }

  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { rows: true },
  });

  if (!batch || batch.type !== type) {
    return fail("NOT_FOUND", "Batch import tidak ditemukan.", 404);
  }

  if (batch.rows.some((row) => !row.isValid)) {
    return fail("CONFLICT", "Batch masih memiliki baris invalid.", 409);
  }

  const updated = await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      dryRun: false,
      status: "COMMITTED",
      committedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "import.commit",
    entityType: "ImportBatch",
    entityId: batchId,
    after: updated,
  });

  return ok({
    batch: updated,
    note: "Commit marker tersimpan. Mapping insert/update domain bisa ditambahkan setelah format CSV final terkunci.",
  });
}
