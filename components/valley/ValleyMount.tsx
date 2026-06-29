"use client";

/* ============================================================
   ValleyMount  ·  the shared playable surface (one scene, two doors)
   The ssr:false Phaser mount + the in-valley DOM chrome (Discovered
   HUD + landmark modal). Consumed by BOTH the /valley route
   (ValleyExperience) and the homepage overlay (ValleyDoor), so the
   scene is never forked. Phaser is dynamically imported here, so it
   stays code-split and loads only when this component mounts.
   The parent provides the fixed full-screen container + background.
   ============================================================ */

import dynamic from "next/dynamic";
import { Discovered } from "@/components/HUD/Discovered";
import { LandmarkModal } from "@/components/valley/LandmarkModal";

const PhaserValley = dynamic(() => import("@/game/PhaserValley"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#2f5a42]">
      <span className="label-mono animate-pulse text-[var(--color-on-dark)]">
        loading the valley…
      </span>
    </div>
  ),
});

export default function ValleyMount() {
  return (
    <>
      <PhaserValley />
      <Discovered />
      <LandmarkModal />
    </>
  );
}
