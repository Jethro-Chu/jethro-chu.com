"use client";

/* ============================================================
   PhaserValley  ·  mounts the Phaser game (client only).
   Imported via next/dynamic({ ssr:false }) ONLY when the visitor
   clicks "Enter the valley", so Phaser + the tilemap land in their
   own code-split chunk, never in the server bundle, the initial
   load, or fallback / crawler traffic.
   ============================================================ */

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { ValleyScene, GAME_W, GAME_H } from "./scenes/ValleyScene";

export default function PhaserValley() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO, // WebGL with a Canvas fallback
      parent: host,
      backgroundColor: "#2f5a42",
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      scale: {
        mode: Phaser.Scale.FIT, // fixed design res scaled to the viewport (renders even at 0-size)
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_W,
        height: GAME_H,
      },
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      audio: { noAudio: true },
      banner: false,
      scene: [ValleyScene],
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="touch-none select-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
