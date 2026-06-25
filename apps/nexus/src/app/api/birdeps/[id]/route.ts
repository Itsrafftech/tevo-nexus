import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { canManageOwnBirdep } from "@/lib/permissions";
import { birdepUpdateSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await requireAuth();
  const { id } = await params;
  const birdep = await prisma.birdep.findUnique({ where: { id } });
  return birdep ? ok(birdep) : fail("NOT_FOUND", "Birdep tidak ditemukan.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAuth();
  const { id } = await params;
  if (!canManageOwnBirdep(session, id)) {
    return fail("FORBIDDEN", "Tidak punya akses mengubah Birdep ini.", 403);
  }

  const parsed = birdepUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input Birdep tidak valid.", 400, parsed.error.flatten());
  }

  const before = await prisma.birdep.findUnique({ where: { id } });
  const birdep = await prisma.birdep.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "birdep.update",
    entityType: "Birdep",
    entityId: id,
    before,
    after: birdep,
  });

  return ok(birdep);
}
