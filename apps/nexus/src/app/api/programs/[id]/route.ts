import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  canUpdateProgramProgress,
  serializeProgramForSession,
} from "@/lib/program-serializer";
import { programSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const program = await prisma.programWork.findUnique({
    where: { id },
    include: {
      primaryBirdep: true,
      collaborators: { include: { birdep: true } },
      pics: { include: { member: true } },
      updates: { orderBy: { createdAt: "desc" } },
      issues: true,
      followUps: true,
      pressRelease: true,
      coverImage: true,
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
    },
  });
  return program
    ? ok(serializeProgramForSession(program, session))
    : fail("NOT_FOUND", "Program tidak ditemukan.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  const existing = await prisma.programWork.findUnique({ where: { id } });
  if (!existing) {
    return fail("NOT_FOUND", "Program tidak ditemukan.", 404);
  }
  if (!canUpdateProgramProgress(session, existing)) {
    return fail("FORBIDDEN", "Tidak punya akses mengubah program ini.", 403);
  }

  const parsed = programSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input program tidak valid.", 400, parsed.error.flatten());
  }

  const program = await prisma.programWork.update({
    where: { id },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      updatedById: session.userId,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "program.update",
    entityType: "ProgramWork",
    entityId: id,
    before: existing,
    after: program,
  });

  return ok(program);
}
