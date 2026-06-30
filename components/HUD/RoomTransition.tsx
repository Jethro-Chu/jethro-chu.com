"use client";

/* ============================================================
   RoomTransition (HUD)  ·  a quick "teleport" veil on room enter/exit
   A brief full-screen flash that masks the cut between the village and an
   interior room: a dark veil with a single teal scanline sweeping down,
   ~420ms. Plays on landmark:enter (materialise in) and room:exit
   (dematerialise out — the room delays its unmount so the veil covers the
   swap). prefers-reduced-motion → a short, still, low-opacity fade.
   ============================================================ */

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { gameBus } from "@/lib/gameBus";

export function RoomTransition() {
  const [run, setRun] = useState(0); // 0 = idle; bump the key to (re)play
  const reduce = useReducedMotion();

  useEffect(() => {
    const fire = () => setRun((n) => n + 1);
    const offEnter = gameBus.on("landmark:enter", fire);
    const offExit = gameBus.on("room:exit", fire);
    return () => {
      offEnter();
      offExit();
    };
  }, []);

  if (!run) return null;

  const dur = reduce ? 0.26 : 0.42;
  return (
    <m.div
      key={run}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ background: "var(--color-shadow)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: reduce ? [0, 0.5, 0] : [0, 1, 1, 0] }}
      transition={{
        duration: dur,
        ease: "easeInOut",
        times: reduce ? [0, 0.5, 1] : [0, 0.28, 0.5, 1],
      }}
      onAnimationComplete={() => setRun(0)}
    >
      {!reduce && (
        <m.div
          className="absolute inset-x-0 h-px"
          style={{
            background: "var(--color-pine)",
            boxShadow: "0 0 14px 3px var(--color-pine)",
          }}
          initial={{ top: "-2%", opacity: 0 }}
          animate={{ top: ["-2%", "102%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: dur, ease: "linear", times: [0, 0.2, 0.8, 1] }}
        />
      )}
    </m.div>
  );
}
