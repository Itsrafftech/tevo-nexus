import { prisma } from "@orma/database";
import { ok } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requirePermission("program.archive.own_birdep");
  const { id } = await params;
  const program = await prisma.programWork.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date(), updatedById: session.userId },
  });
  await writeAuditLog({ actorUserId: session.userId, action: "program.archive", entityType: "ProgramWork", entityId: id, after: program });
  return ok(program);
}
