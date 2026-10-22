import { OWNER_COOKIE, newOwnerToken, ownerHash, ownerToken, ownsSession, publicSession, validSessionPayload } from "@/lib/medmath/sessionSecurity";
import { protectApi } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSession, claimOwnedSession } from "@/lib/medmath/store";
import type { StoredSession } from "@/lib/medmath/types";

export const dynamic = "force-dynamic";

async function handlePOST(req: NextRequest) {
  try {
    const session = (await req.json()) as StoredSession;
    if (!validSessionPayload(session)) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const token = ownerToken(req) ?? newOwnerToken();
    const claimed = await claimOwnedSession({ ...session, ownerHash: ownerHash(token) });
    if (!ownsSession(claimed, token)) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    await saveSession({ ...session, ownerHash: claimed.ownerHash });
    const response = NextResponse.json({ success: true, sessionId: session.sessionId });
    response.cookies.set(OWNER_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
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
    if (!session || !ownsSession(session, ownerToken(req))) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: publicSession(session) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/medmath/session] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}

export const POST = protectApi(handlePOST, { scope: "medmath-session", perMinute: 15, daily: 5000, maxBytes: 262144 });
