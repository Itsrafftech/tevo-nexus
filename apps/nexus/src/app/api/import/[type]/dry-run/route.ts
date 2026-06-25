import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { validateImport, type ImportType } from "@/lib/importers";

type Params = { params: Promise<{ type: string }> };

const allowedTypes = new Set(["members", "birdeps", "press-releases"]);

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { type } = await params;
  if (!allowedTypes.has(type)) {
    return fail("BAD_REQUEST", "Tipe import tidak didukung.", 400);
  }

  const { csvText, fileName } = await request.json();
  if (typeof csvText !== "string") {
    return fail("BAD_REQUEST", "csvText wajib berupa string.", 400);
  }

  const rows = validateImport(type as ImportType, csvText);
  const batch = await prisma.importBatch.create({
    data: {
      type,
      fileName,
      dryRun: true,
      status: rows.every((row) => row.errors.length === 0) ? "VALID" : "INVALID",
      summary: {
        totalRows: rows.length,
        validRows: rows.filter((row) => row.errors.length === 0).length,
        invalidRows: rows.filter((row) => row.errors.length > 0).length,
      },
      createdById: session.userId,
      rows: {
        create: rows.map((row) => ({
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          normalizedData: row.normalizedData,
          errors: row.errors,
          isValid: row.errors.length === 0,
        })),
      },
    },
    include: { rows: true },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "import.dry_run",
    entityType: "ImportBatch",
    entityId: batch.id,
    after: batch.summary,
  });

  return ok(batch, { status: 201 });
}
