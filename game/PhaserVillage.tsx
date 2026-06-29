"use client";

/* ============================================================
   PhaserVillage  ·  mounts the Phaser village (client only).
   Imported via next/dynamic({ ssr:false }) ONLY when the visitor
   enters, so Phaser + the tilemap land in their own code-split chunk.
   ============================================================ */

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { VillageScene, GAME_W, GAME_H } from "./scenes/VillageScene";

export default function PhaserVillage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
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
        width: GAME_W,
        height: GAME_H,
      },
      physics: { default: "arcade", arcade: { debug: false } },
      audio: { noAudio: true },
      banner: false,
      scene: [VillageScene],
    });
    return () => game.destroy(true);
  }, []);

  return (
    <div ref={hostRef} className="touch-none select-none" style={{ width: "100%", height: "100%" }} />
  );
}
