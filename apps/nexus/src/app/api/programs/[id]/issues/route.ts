import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { canReadProgramDetail, canUpdateProgramProgress } from "@/lib/program-serializer";
import { programIssueSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({
    where: { id },
    include: { issues: true },
  });
  if (!program) return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  if (!canReadProgramDetail(session, program)) {
    return fail("FORBIDDEN", "Tidak punya akses detail isu program.", 403);
  }
  return ok(program.issues);
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({ where: { id } });
  if (!program) return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  if (!canUpdateProgramProgress(session, program)) {
    return fail("FORBIDDEN", "Tidak punya akses membuat isu program ini.", 403);
  }

  const parsed = programIssueSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input isu tidak valid.", 400, parsed.error.flatten());
  }

  const issue = await prisma.programIssue.create({
    data: {
      programId: id,
      description: parsed.data.description,
      isResolved: parsed.data.isResolved,
      createdById: session.userId,
    },
  });
  await writeAuditLog({
    actorUserId: session.userId,
    action: "program.issue.create",
    entityType: "ProgramIssue",
    entityId: issue.id,
    after: issue,
  });
  return ok(issue, { status: 201 });
}
