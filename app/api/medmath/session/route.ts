import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSession } from "@/lib/medmath/store";
import type { StoredSession } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = (await req.json()) as StoredSession;
    if (!session.sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await saveSession(session);
    return NextResponse.json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    console.error("[api/medmath/session] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[api/medmath/session] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}
