import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { rejectApprovalSchema } from "@/lib/validations/cms";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requirePermission("tevo.approval.reject");
  const { id } = await params;
  const parsed = rejectApprovalSchema.safeParse(await request.json());
  if (!parsed.success) return fail("BAD_REQUEST", "Catatan reject wajib diisi.", 400, parsed.error.flatten());

  const approval = await prisma.tevoApprovalRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: session.userId, note: parsed.data.note },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "tevo.approval.reject", entityType: approval.contentType, entityId: approval.contentId, after: approval });
  return ok(approval);
}
