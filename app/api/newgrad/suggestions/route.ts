import { NextRequest, NextResponse } from "next/server";
import { getAllSuggestions, saveSuggestion } from "@/lib/newgrad/suggestions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ipRequests = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || entry.resetAt <= now) {
    ipRequests.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10; // 10 suggestions per minute per IP
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many suggestions submitted. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      hospital_name?: unknown;
      location?: unknown;
      city?: unknown;
      state?: unknown;
      url?: unknown;
      notes?: unknown;
    };

    if (
      !body.hospital_name ||
      typeof body.hospital_name !== "string" ||
      body.hospital_name.trim().length < 2 ||
      body.hospital_name.trim().length > 200
    ) {
      return NextResponse.json(
        { error: "Please enter a valid hospital or health system name." },
        { status: 400 },
      );
    }

    if (body.url && (typeof body.url !== "string" || body.url.length > 2048)) {
      return NextResponse.json(
        { error: "The provided URL is invalid or too long." },
        { status: 400 },
      );
    }

    if (body.notes && (typeof body.notes !== "string" || body.notes.length > 2000)) {
      return NextResponse.json(
        { error: "Notes cannot exceed 2000 characters." },
        { status: 400 },
      );
    }

    const resolvedLocation =
      typeof body.location === "string" && body.location.trim().length > 0
        ? body.location.trim()
        : [body.city, body.state]
            .filter((x) => typeof x === "string" && x.trim().length > 0)
            .map((x) => (x as string).trim())
            .join(", ") || null;

    const suggestion = await saveSuggestion({
      hospital_name: body.hospital_name,
      location: resolvedLocation,
      url: typeof body.url === "string" ? body.url : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });

    return NextResponse.json({
      ok: true,
      message: "Suggestion saved. Queued for next daily research run.",
      suggestion,
    });
  } catch (error) {
    console.error("[api/newgrad/suggestions] error:", error);
    return NextResponse.json(
      { error: "Failed to save suggestion. Please try again later." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const suggestions = await getAllSuggestions();
    return NextResponse.json({
      ok: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error("[api/newgrad/suggestions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve suggestions." },
      { status: 500 },
    );
  }
}
