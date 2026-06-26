import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireAuth();
  if (
    !session.permissions.includes("news.delete.all") &&
    !session.permissions.includes("news.manage.all")
  ) {
    return fail("FORBIDDEN", "Tidak punya akses archive news.", 403);
  }

  const { id } = await params;
  const news = await prisma.tevoNewsArticle.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "news.archive",
    entityType: "TevoNewsArticle",
    entityId: id,
    after: news,
  });

  return ok(news);
}
