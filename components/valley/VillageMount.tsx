"use client";

/* ============================================================
   VillageMount  ·  the playable village surface (one scene, two doors)
   The ssr:false Phaser mount + the title screen (intro) and, once
   playing, the in-village DOM chrome (nav, minimap, panel).
   Phaser is dynamically imported here, so it stays code-split and loads
   only when this mounts on the homepage.
   The parent provides the fixed full-screen container.
   ============================================================ */

import dynamic from "next/dynamic";
import { useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { Minimap } from "@/components/HUD/Minimap";
import { VillageNav } from "@/components/HUD/VillageNav";
import { ZoomControls } from "@/components/HUD/ZoomControls";
import { Joystick } from "@/components/HUD/Joystick";
import { DirectionCue } from "@/components/HUD/DirectionCue";
import { ControlsHint } from "@/components/HUD/ControlsHint";
import { EnterPrompt } from "@/components/HUD/EnterPrompt";
import { RoomTransition } from "@/components/HUD/RoomTransition";
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

export default function VillageMount({ onLeave }: { onLeave?: () => void }) {
  const [intro, setIntro] = useState(true);

  return (
    <>
      <PhaserVillage />
      {intro ? (
        <VillageIntro
          onPlay={() => {
            setIntro(false);
            gameBus.emit("valley:play");
          }}
          onSkip={() => window.location.assign("/website")}
        />
      ) : (
        <>
          <VillageNav onLeave={onLeave} />
          <Minimap />
          <ZoomControls />
          <Joystick />
          <DirectionCue />
          <ControlsHint />
          <EnterPrompt />
        </>
      )}
      <InteriorRoom />
      <RoomTransition />
    </>
  );
}
