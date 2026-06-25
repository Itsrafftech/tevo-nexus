import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { memberSchema } from "@/lib/validations/core";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session.permissions.includes("member.update.own_birdep") && !session.permissions.includes("member.manage.all")) {
    return fail("FORBIDDEN", "Tidak punya akses mengubah anggota.", 403);
  }

  const { id } = await params;
  const parsed = memberSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input anggota tidak valid.", 400, parsed.error.flatten());
  }

  const before = await prisma.member.findUnique({ where: { id } });
  const member = await prisma.member.update({
    where: { id },
    data: {
      fullName: parsed.data.fullName,
      nim: parsed.data.nim,
      instagram: parsed.data.instagram,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "member.update",
    entityType: "Member",
    entityId: id,
    before,
    after: member,
  });

  return ok(member);
}
