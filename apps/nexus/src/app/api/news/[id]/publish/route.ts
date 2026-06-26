import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireAuth();
  if (
    !session.permissions.includes("cms.publish") &&
    !session.permissions.includes("news.manage.all")
  ) {
    return fail("FORBIDDEN", "Tidak punya akses publish news.", 403);
  }

  const { id } = await params;
  const news = await prisma.tevoNewsArticle.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "news.publish",
    entityType: "TevoNewsArticle",
    entityId: id,
    after: news,
  });

  return ok(news);
}
