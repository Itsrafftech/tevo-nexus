import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export function paginationParams(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") ?? 20), 1),
    100,
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
    q: searchParams.get("q")?.trim() || undefined,
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
  } as const;
}
