import { protectApi } from "@/lib/apiSecurity";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAllSuggestions, saveSuggestion } from "@/lib/newgrad/suggestions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handlePOST(request: NextRequest) {
  try {
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

    if (body.url && (typeof body.url !== "string" || body.url.length > 2048 || !safeWebUrl(body.url))) {
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

    for (const value of [body.location, body.city, body.state]) {
      if (value !== undefined && value !== null && (typeof value !== "string" || value.length > 300)) {
        return NextResponse.json({ error: "Invalid location." }, { status: 400 });
      }
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

export async function GET(request: NextRequest) {
  const token = process.env.NEWGRAD_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = token ? `Bearer ${token}` : "";
  if (!token || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const suggestions = await getAllSuggestions();
    return NextResponse.json({
      ok: true,
      count: suggestions.length,
      suggestions,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/newgrad/suggestions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve suggestions." },
      { status: 500 },
    );
  }
}

function safeWebUrl(value: string): boolean {
  try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password; }
  catch { return false; }
}

export const POST = protectApi(handlePOST, { scope: "suggestions", perMinute: 3, daily: 200, maxBytes: 8192 });
