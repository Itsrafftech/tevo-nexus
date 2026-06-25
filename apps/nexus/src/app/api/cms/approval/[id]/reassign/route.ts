import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { reassignApprovalSchema } from "@/lib/validations/cms";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requirePermission("tevo.approval.reassign");
  const { id } = await params;
  const parsed = reassignApprovalSchema.safeParse(await request.json());
  if (!parsed.success) return fail("BAD_REQUEST", "Reviewer tidak valid.", 400, parsed.error.flatten());

  const approval = await prisma.tevoApprovalRequest.update({
    where: { id },
    data: { reviewerId: parsed.data.reviewerId },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "tevo.approval.reassign", entityType: approval.contentType, entityId: approval.contentId, after: approval });
  return ok(approval);
}
