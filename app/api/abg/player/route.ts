import { NextRequest, NextResponse } from "next/server";
import { createPlayer, updateDisplayName } from "@/lib/abg/service";
import { getPlayer, getRank } from "@/lib/abg/store";
import { publicPlayer } from "@/lib/abg/public";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const COOKIE_NAME = "abg_player";

function setPlayerCookie(response: NextResponse, playerId: string) {
  response.cookies.set(COOKIE_NAME, playerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function GET(request: NextRequest) {
  const id = request.cookies.get(COOKIE_NAME)?.value;
  if (!id) return NextResponse.json({ player: null });
  const player = await getPlayer(id);
  if (!player) {
    const response = NextResponse.json({ player: null });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
  return NextResponse.json({ player: publicPlayer(player, await getRank(id)) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { displayName?: unknown };
    const player = await createPlayer(body.displayName);
    const response = NextResponse.json({ player: publicPlayer(player, 1) }, { status: 201 });
    setPlayerCookie(response, player.id);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create player." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const id = request.cookies.get(COOKIE_NAME)?.value;
    if (!id) return NextResponse.json({ error: "Player not found." }, { status: 401 });
    const body = await request.json() as { displayName?: unknown };
    const player = await updateDisplayName(id, body.displayName);
    return NextResponse.json({ player: publicPlayer(player, await getRank(id)) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update display name." },
      { status: 400 },
    );
  }
}
