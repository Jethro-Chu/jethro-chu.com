"use client";

/* ============================================================
   VillageMount  ·  the playable village surface (one scene, two doors)
   The ssr:false Phaser mount + the title screen (intro) and, once
   playing, the in-village DOM chrome (nav, minimap, Discovered, panel).
   Phaser is dynamically imported here, so it stays code-split and loads
   only when this mounts (after the homepage "Enter" click, or /village).
   The parent provides the fixed full-screen container.
   ============================================================ */

import dynamic from "next/dynamic";
import { useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { Discovered } from "@/components/HUD/Discovered";
import { Minimap } from "@/components/HUD/Minimap";
import { VillageNav } from "@/components/HUD/VillageNav";
import { ZoomControls } from "@/components/HUD/ZoomControls";
import { DirectionCue } from "@/components/HUD/DirectionCue";
import { ControlsHint } from "@/components/HUD/ControlsHint";
import { EnterPrompt } from "@/components/HUD/EnterPrompt";
import { InteriorRoom } from "@/components/valley/InteriorRoom";
import { VillageIntro } from "@/components/valley/VillageIntro";

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
  const [intro, setIntro] = useState(true);

  // "Read the portfolio" -> the original scroll site at /. Set the session flag
  // first so / shows the site instead of re-opening the village over it.
  const leaveToSite = () => {
    try {
      sessionStorage.setItem("village-closed", "1");
    } catch {
      /* private mode */
    }
    window.location.assign("/");
  };

  return (
    <>
      <PhaserVillage />
      {intro ? (
        <VillageIntro
          onPlay={() => {
            setIntro(false);
            gameBus.emit("valley:play");
          }}
          onSkip={leaveToSite}
        />
      ) : (
        <>
          <VillageNav />
          <Minimap />
          <Discovered />
          <ZoomControls />
          <DirectionCue />
          <ControlsHint />
          <EnterPrompt />
        </>
      )}
      <InteriorRoom />
    </>
  );
}
