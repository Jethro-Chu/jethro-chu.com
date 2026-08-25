import { NextRequest, NextResponse } from "next/server";
import { getPlayerByName, getRank } from "@/lib/abg/store";
import { publicPlayer } from "@/lib/abg/public";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const player = await getPlayerByName(name);
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });
  return NextResponse.json({ player: publicPlayer(player, await getRank(player.id)) });
}

