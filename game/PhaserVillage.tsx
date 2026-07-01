"use client";

/* ============================================================
   PhaserVillage  ·  mounts the Phaser village (client only).
   Imported via next/dynamic({ ssr:false }) ONLY when the visitor
   enters, so Phaser + the tilemap land in their own code-split chunk.
   ============================================================ */

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { VillageScene, computeGameSize } from "./scenes/VillageScene";

export default function PhaserVillage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Match the internal resolution to the viewport's aspect at boot so Scale.FIT
    // fills the screen (portrait shows a taller slice) instead of letterboxing a
    // fixed 16:9 frame into a thin strip on a phone.
    const initial = computeGameSize(window.innerWidth, window.innerHeight);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      backgroundColor: "#3f7a57",
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: initial.width,
        height: initial.height,
      },
      physics: { default: "arcade", arcade: { debug: false } },
      audio: { noAudio: true },
      banner: false,
      scene: [VillageScene],
    });

    // Rotating the phone flips the aspect ratio; re-derive the base size so FIT
    // keeps filling the screen instead of re-introducing letterbox bars. FIT
    // rescales the canvas itself — we only nudge the base size when it changes.
    // rAF-coalesced (resize + orientationchange can fire in bursts).
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { width, height } = computeGameSize(window.innerWidth, window.innerHeight);
        const size = game.scale.gameSize;
        if (Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) {
          game.scale.setGameSize(width, height);
        }
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      game.destroy(true);
    };
  }, []);

  return (
    <div ref={hostRef} className="touch-none select-none" style={{ width: "100%", height: "100%" }} />
  );
}
