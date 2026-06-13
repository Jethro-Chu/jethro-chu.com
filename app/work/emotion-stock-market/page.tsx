import type { Metadata } from "next";
import { getProject } from "@/lib/projects";
import { GameStage } from "@/components/work/GameStage";

const project = getProject("emotion-stock-market");

export const metadata: Metadata = {
  title: "Emotion Stock Market — Play",
  description:
    project?.summary ??
    "Trade a simulated Bloomberg-style market with your facial expressions — on-device, nothing uploaded.",
};

const CONSENT =
  project?.live?.consent ??
  "This game uses your camera to read your facial expressions. It runs entirely in your browser; nothing is recorded or uploaded.";

export default function EmotionStockMarketPage() {
  return <GameStage consent={CONSENT} />;
}
