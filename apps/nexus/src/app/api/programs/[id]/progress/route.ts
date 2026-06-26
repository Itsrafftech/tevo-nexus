import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { canReadProgramDetail, canUpdateProgramProgress } from "@/lib/program-serializer";
import { progressUpdateSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({
    where: { id },
    include: {
      primaryBirdep: true,
      updates: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!program) {
    return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  }

  if (!canReadProgramDetail(session, program)) {
    return ok({
      programId: program.id,
      name: program.name,
      birdep: program.primaryBirdep,
      status: program.status,
      progressPercent: program.progressPercent,
    });
  }

  return ok(program.updates);
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({ where: { id } });
  if (!program) {
    return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  }
  if (!canUpdateProgramProgress(session, program)) {
    return fail("FORBIDDEN", "Ksatria hanya boleh update progres Birdep sendiri.", 403);
  }

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
