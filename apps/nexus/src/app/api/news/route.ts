import { prisma } from "@orma/database";
import { fail, ok, paginationParams } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { newsArticleSchema } from "@/lib/validations/cms";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session.permissions.includes("news.read")) {
    return fail("FORBIDDEN", "Tidak punya akses membaca news.", 403);
  }

  const pagination = paginationParams(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([
    prisma.tevoNewsArticle.findMany({
      where: { status: { not: "ARCHIVED" } },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { updatedAt: "desc" },
      include: { image: true },
    }),
    prisma.tevoNewsArticle.count({ where: { status: { not: "ARCHIVED" } } }),
  ]);

  return ok({ items, total, page: pagination.page, pageSize: pagination.pageSize });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (
    !session.permissions.includes("news.create") &&
    !session.permissions.includes("news.manage.all")
  ) {
    return fail("FORBIDDEN", "Tidak punya akses membuat news.", 403);
  }

  const parsed = newsArticleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail("BAD_REQUEST", "Input news tidak valid.", 400, parsed.error.flatten());
  }

  const news = await prisma.tevoNewsArticle.create({
    data: {
      ...parsed.data,
      status: parsed.data.status ?? "DRAFT",
      submittedBy: session.userId,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  await writeAuditLog({
    actorUserId: session.userId,
    action: "news.create",
    entityType: "TevoNewsArticle",
    entityId: news.id,
    after: news,
  });

  return ok(news, { status: 201 });
}
