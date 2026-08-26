import { NextRequest, NextResponse } from "next/server";
import { publicQuestion, sessionSummary, startSession } from "@/lib/abg/service";
import { checkRateLimit, getPlayer, getRank, getSession } from "@/lib/abg/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const playerId = request.cookies.get("abg_player")?.value;
    if (!playerId || !await getPlayer(playerId)) return NextResponse.json({ error: "Create an ABG name first." }, { status: 401 });
    if (!await checkRateLimit(playerId, "session", 12)) return NextResponse.json({ error: "Please wait before starting another session." }, { status: 429 });
    const body = await request.json() as { mode?: "ranked" };
    if (body.mode !== "ranked") return NextResponse.json({ error: "Only Ranked mode is available." }, { status: 400 });
    const result = await startSession(playerId, "ranked");
    const rank = await getRank(playerId);
    return NextResponse.json({ session: sessionSummary(result.session, rank), question: result.question });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start session." }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("abg_player")?.value;
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!playerId || !sessionId) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    const session = await getSession(sessionId);
    if (!session || session.playerId !== playerId || session.mode !== "ranked") return NextResponse.json({ error: "Session not found." }, { status: 404 });
    const rank = await getRank(playerId);
    return NextResponse.json({
      session: sessionSummary(session, rank),
      question: session.completed ? null : publicQuestion(session),
    });
  } catch {
    return NextResponse.json({ error: "Could not restore the session." }, { status: 500 });
  }
}
