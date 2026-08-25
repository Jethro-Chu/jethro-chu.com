import type { Metadata } from "next";
import { ABGLeaderboard } from "@/components/abg/ABGLeaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · ABG Arena",
  description: "ABG Arena rating, accuracy, correct-answer, and Survival rankings.",
};

export default function ABGLeaderboardPage() {
  return <ABGLeaderboard />;
}

