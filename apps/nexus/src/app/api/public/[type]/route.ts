import { fail, ok } from "@/lib/api-response";
import { getPublishedContent } from "@/lib/public-content";

type Params = { params: Promise<{ type: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { type } = await params;
  const data = await getPublishedContent(type);
  return data === null
    ? fail("NOT_FOUND", "Konten publik tidak ditemukan.", 404)
    : ok(data);
}
