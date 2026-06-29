import type { Metadata } from "next";
import { FlatValley } from "@/components/valley/FlatValley";
import { ValleyExperience } from "@/components/ValleyExperience";

export const metadata: Metadata = {
  title: "The valley · Jethro Chu",
  description:
    "An explorable pixel Yosemite Valley that doubles as Jethro Chu's portfolio. Walk the valley floor and discover the landmarks, or read the flat version.",
};

/**
 * Prototype route for the Yosemite valley (feat/yosemite-valley).
 * FlatValley is the real, SSR'd, indexable content; ValleyExperience layers the
 * entry card + the code-split Phaser valley over it. The live homepage and the
 * shipped scroll site are untouched.
 */
export default function ValleyPage() {
  return (
    <main id="main" className="relative min-h-screen bg-[var(--color-sand)]">
      <FlatValley />
      <ValleyExperience />
    </main>
  );
}
