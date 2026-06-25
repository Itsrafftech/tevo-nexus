import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { contentPayloadSchema } from "@/lib/validations/cms";

type Params = { params: Promise<{ type: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requirePermission("tevo.content.submit_review");
  const { type } = await params;
  const parsed = contentPayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Payload konten tidak valid.", 400, parsed.error.flatten());
  }

  const approval = await prisma.tevoApprovalRequest.create({
    data: {
      contentType: type,
      contentId: crypto.randomUUID(),
      status: "DRAFT",
      submittedById: session.userId,
      note: JSON.stringify(parsed.data.payload),
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "tevo.content.create",
    entityType: "TevoApprovalRequest",
    entityId: approval.id,
    after: approval,
  });

  return ok(approval, { status: 201 });
}
