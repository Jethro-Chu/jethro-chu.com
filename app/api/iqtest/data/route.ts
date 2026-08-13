import { NextResponse } from "next/server";
import type { PublicAttemptSort } from "@/lib/iqtest/public-data";
import { getPublicIQData, hasIQResultsStore } from "@/lib/iqtest/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SORT_OPTIONS = new Set<PublicAttemptSort>([
  "recent",
  "highest",
  "lowest",
  "fastest",
  "slowest",
]);

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}

export async function GET(request: Request) {
  if (!hasIQResultsStore()) {
    return noStoreJson({ error: "IQ test data is unavailable." }, 503);
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedSort = searchParams.get("sort") ?? "recent";
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);
  if (
    !SORT_OPTIONS.has(requestedSort as PublicAttemptSort) ||
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 5 ||
    pageSize > 50
  ) {
    return noStoreJson({ error: "Invalid data query." }, 400);
  }

  try {
    return noStoreJson(
      await getPublicIQData({
        page,
        pageSize,
        sort: requestedSort as PublicAttemptSort,
      }),
    );
  } catch (error) {
    console.error("[iq-data] public snapshot failed", error);
    return noStoreJson({ error: "IQ test data is unavailable." }, 503);
  }
}
