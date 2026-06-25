import { prisma } from "@orma/database";
import { ok, paginationParams } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

export async function GET(request: Request) {
  await requirePermission("audit.read.all");
  const pagination = paginationParams(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return ok({ items, total, page: pagination.page, pageSize: pagination.pageSize });
}
