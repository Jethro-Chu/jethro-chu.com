import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getPlayer, getRank, type LeaderboardTab } from "@/lib/abg/store";
import { publicPlayer } from "@/lib/abg/public";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const tabParam = new URL(request.url).searchParams.get("tab") ?? "rating";
    const tab: LeaderboardTab = ["rating", "accuracy", "correct", "survival"].includes(tabParam)
      ? tabParam as LeaderboardTab
      : "rating";
    const rows = await getLeaderboard(tab, 50);
    const playerId = request.cookies.get("abg_player")?.value;
    const current = playerId ? await getPlayer(playerId) : null;
    const currentRank = current ? await getRank(current.id, tab) : null;
    return NextResponse.json({
      tab,
      minimumAccuracyQuestions: 50,
      rows: rows.map(({ rank, player }) => publicPlayer(player, rank)),
      currentPlayer: current ? publicPlayer(current, currentRank) : null,
    });
  } catch {
    return NextResponse.json({ error: "Leaderboard is temporarily unavailable." }, { status: 503 });
  }
}
