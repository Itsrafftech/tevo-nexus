import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { submitReviewSchema } from "@/lib/validations/cms";

type Params = { params: Promise<{ type: string; id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requirePermission("tevo.content.submit_review");
  const { type, id } = await params;
  const parsed = submitReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input review tidak valid.", 400, parsed.error.flatten());
  }

  const approval = await prisma.tevoApprovalRequest.create({
    data: {
      contentType: type,
      contentId: id,
      status: "IN_REVIEW",
      submittedById: session.userId,
      reviewerId: parsed.data.reviewerId,
      note: parsed.data.note,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "tevo.approval.submit",
    entityType: type,
    entityId: id,
    after: approval,
  });

  return ok(approval, { status: 201 });
}
