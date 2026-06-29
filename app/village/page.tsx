import type { Metadata } from "next";
import { FlatValley } from "@/components/valley/FlatValley";
import { VillageStandalone } from "@/components/valley/VillageStandalone";

export const metadata: Metadata = {
  title: "Yosemite Village · Jethro Chu",
  description:
    "An explorable pixel Yosemite Village that doubles as Jethro Chu's portfolio. Walk the town and enter the buildings, or read the flat version.",
};

/**
 * Standalone village route (feat/yosemite-village). FlatValley is the real,
 * SSR'd, indexable content; VillageStandalone mounts the playable town over it.
 * The homepage reuses the SAME VillageMount via the "Enter Yosemite Village"
 * overlay (ValleyDoor); this route is a direct link + dev surface.
 */
export default function VillagePage() {
  return (
    <main id="main" className="relative min-h-screen bg-[var(--color-sand)]">
      <FlatValley />
      <VillageStandalone />
    </main>
  );
}
