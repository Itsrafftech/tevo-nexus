import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { canReadProgramDetail, canUpdateProgramProgress } from "@/lib/program-serializer";
import { programFollowUpSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({
    where: { id },
    include: { followUps: true },
  });
  if (!program) return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  if (!canReadProgramDetail(session, program)) {
    return fail("FORBIDDEN", "Tidak punya akses detail tindak lanjut program.", 403);
  }
  return ok(program.followUps);
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({ where: { id } });
  if (!program) return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  if (!canUpdateProgramProgress(session, program)) {
    return fail("FORBIDDEN", "Tidak punya akses membuat tindak lanjut program ini.", 403);
  }

  const parsed = programFollowUpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input tindak lanjut tidak valid.", 400, parsed.error.flatten());
  }

  const followUp = await prisma.programFollowUp.create({
    data: {
      programId: id,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : undefined,
      createdById: session.userId,
    },
  });
  await writeAuditLog({
    actorUserId: session.userId,
    action: "program.follow_up.create",
    entityType: "ProgramFollowUp",
    entityId: followUp.id,
    after: followUp,
  });
  return ok(followUp, { status: 201 });
}
