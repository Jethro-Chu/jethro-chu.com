import { NextRequest, NextResponse } from "next/server";
import { ABG_COMPENSATIONS, ABG_DISORDERS } from "@/lib/abg/types";
import { submitAnswer } from "@/lib/abg/service";
import { checkRateLimit, getPlayer } from "@/lib/abg/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const playerId = request.cookies.get("abg_player")?.value;
    if (!playerId || !await getPlayer(playerId)) return NextResponse.json({ error: "Player not found." }, { status: 401 });
    if (!await checkRateLimit(playerId, "attempt", 90)) return NextResponse.json({ error: "Too many answers. Please wait a moment." }, { status: 429 });
    const body = await request.json() as { sessionId?: unknown; questionId?: unknown; disorder?: unknown; compensation?: unknown };
    if (typeof body.sessionId !== "string" || typeof body.questionId !== "string") return NextResponse.json({ error: "Invalid answer request." }, { status: 400 });
    if (!ABG_DISORDERS.includes(body.disorder as never) || !ABG_COMPENSATIONS.includes(body.compensation as never)) return NextResponse.json({ error: "Choose both parts of the interpretation." }, { status: 400 });
    const result = await submitAnswer(playerId, body.sessionId, body.questionId, {
      disorder: body.disorder as (typeof ABG_DISORDERS)[number],
      compensation: body.compensation as (typeof ABG_COMPENSATIONS)[number],
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not grade answer.";
    const status = message.includes("already submitted") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

