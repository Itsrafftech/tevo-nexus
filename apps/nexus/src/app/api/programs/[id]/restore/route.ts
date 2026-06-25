import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requirePermission("program.restore.own_birdep");
  const { id } = await params;
  const program = await prisma.programWork.update({
    where: { id },
    data: { status: "NOT_STARTED", archivedAt: null, updatedById: session.userId },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "program.restore", entityType: "ProgramWork", entityId: id, after: program });
  return ok(program);
}
