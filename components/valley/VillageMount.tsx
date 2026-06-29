"use client";

/* ============================================================
   VillageMount  ·  the playable village surface
   The ssr:false Phaser mount + in-village DOM chrome (minimap,
   Discovered HUD, building panel). Phaser is dynamically imported
   here, so it stays code-split and loads only when this mounts.
   The parent (ValleyDoor) provides the fixed full-screen container.
   ============================================================ */

import dynamic from "next/dynamic";
import { Discovered } from "@/components/HUD/Discovered";
import { Minimap } from "@/components/HUD/Minimap";
import { VillageNav } from "@/components/HUD/VillageNav";
import { LandmarkModal } from "@/components/valley/LandmarkModal";

const PhaserVillage = dynamic(() => import("@/game/PhaserVillage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#3f7a57]">
      <span className="label-mono animate-pulse text-[var(--color-on-dark)]">
        loading the village…
      </span>
    </div>
  ),
});

export default function VillageMount() {
  return (
    <>
      <PhaserVillage />
      <VillageNav />
      <Minimap />
      <Discovered />
      <LandmarkModal />
    </>
  );
}
