import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requirePermission("tevo.approval.approve");
  const { id } = await params;
  const approval = await prisma.tevoApprovalRequest.update({
    where: { id },
    data: { status: "PUBLISHED", reviewedAt: new Date(), publishedAt: new Date(), reviewerId: session.userId },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "tevo.approval.approve", entityType: approval.contentType, entityId: approval.contentId, after: approval });
  return ok(approval);
}
