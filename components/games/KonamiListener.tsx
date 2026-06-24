"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// code-split: the game chunk is fetched only once the egg is triggered, so it
// never touches first-load JS.
const AscentGame = dynamic(() => import("./AscentGame"), { ssr: false });

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

declare global {
  interface Window {
    /** console hint hook: call climb() to open the hidden Ascent game */
    climb?: () => void;
  }
}

export function KonamiListener() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const want = KONAMI[i];
      if (e.key.toLowerCase() === want.toLowerCase()) {
        i++;
        if (i === KONAMI.length) {
          i = 0;
          setOpen(true);
        }
      } else {
        // restart, but allow the mismatched key to be a fresh first step
        i = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    window.climb = () => setOpen(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (window.climb) delete window.climb;
    };
  }, []);

  if (!open) return null;
  return <AscentGame onClose={() => setOpen(false)} />;
}
