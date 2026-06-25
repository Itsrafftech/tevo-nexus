import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { progressUpdateSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requirePermission("progress.create.own_birdep");
  const { id } = await params;
  const parsed = progressUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input progress tidak valid.", 400, parsed.error.flatten());
  }

  const update = await prisma.programProgressUpdate.create({
    data: {
      programId: id,
      progressPercent: parsed.data.progressPercent,
      updateText: parsed.data.updateText,
      internalIssue: parsed.data.internalIssue,
      internalFollowUp: parsed.data.internalFollowUp,
      createdById: session.userId,
    },
  });
  await prisma.programWork.update({
    where: { id },
    data: { progressPercent: parsed.data.progressPercent, updatedById: session.userId },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "program.progress.create", entityType: "ProgramProgressUpdate", entityId: update.id, after: update });
  return ok(update, { status: 201 });
}
