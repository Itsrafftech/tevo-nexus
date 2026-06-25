import { fail, ok } from "@/lib/api-response";
import { getPublishedContent } from "@/lib/public-content";

type Params = { params: Promise<{ type: string; slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { type, slug } = await params;
  const data = await getPublishedContent(type, slug);
  return data ? ok(data) : fail("NOT_FOUND", "Konten publik tidak ditemukan.", 404);
}
