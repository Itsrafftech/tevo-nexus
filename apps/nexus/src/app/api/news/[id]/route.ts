import { prisma } from "@orma/database";
import { fail, ok } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { newsArticleSchema } from "@/lib/validations/cms";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session.permissions.includes("news.read")) {
    return fail("FORBIDDEN", "Tidak punya akses membaca news.", 403);
  }

  const { id } = await params;
  const news = await prisma.tevoNewsArticle.findUnique({
    where: { id },
    include: { image: true },
  });

  return news ? ok(news) : fail("NOT_FOUND", "News tidak ditemukan.", 404);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAuth();
  if (
    !session.permissions.includes("news.update.all") &&
    !session.permissions.includes("news.manage.all")
  ) {
    return fail("FORBIDDEN", "Tidak punya akses mengubah news.", 403);
  }

  const { id } = await params;
  const parsed = newsArticleSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input news tidak valid.", 400, parsed.error.flatten());
  }

  const before = await prisma.tevoNewsArticle.findUnique({ where: { id } });
  if (!before) {
    return fail("NOT_FOUND", "News tidak ditemukan.", 404);
  }

  const news = await prisma.tevoNewsArticle.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "news.update",
    entityType: "TevoNewsArticle",
    entityId: id,
    before,
    after: news,
  });

  return ok(news);
}

export async function DELETE(_request: Request, { params }: Params) {
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
