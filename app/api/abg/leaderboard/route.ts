import { NextRequest, NextResponse } from "next/server";
import { publicPlayer } from "@/lib/abg/public";
import { getLeaderboard, getPlayer, getRank } from "@/lib/abg/store";
import type { ABGPlayer } from "@/lib/abg/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("abg_player")?.value;
    const [rows, current] = await Promise.all([
      getLeaderboard(50),
      playerId ? getPlayer(playerId) : Promise.resolve(null),
    ]);
    const currentRank = current ? await getRank(current.id) : null;
    return NextResponse.json({
      rows: rows.map(({ rank, player }) => rankRow(player, rank)),
      currentPlayer: current ? rankRow(current, currentRank) : null,
    });
  } catch {
    return NextResponse.json({ error: "Ranks are temporarily unavailable." }, { status: 503 });
  }
}

function rankRow(player: ABGPlayer, rank: number | null) {
  const publicData = publicPlayer(player, rank);
  return {
    rank: publicData.rank,
    displayName: publicData.displayName,
    rating: publicData.rating,
    accuracy: publicData.accuracy,
    rankedQuestionsAnswered: publicData.rankedQuestionsAnswered,
    rankedQuestionsCorrect: publicData.rankedQuestionsCorrect,
    bestStreak: publicData.bestStreak,
  };
}
