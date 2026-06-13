"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Full-screen stage for the self-hosted Bloomberg-terminal game.
 *
 * - Site nav stays pinned (global, fixed); this fills the rest of the viewport
 *   via svh so mobile browser chrome doesn't leave a gap.
 * - The camera is NOT requested on load: a consent gate + Start shows first.
 *   Start mounts the same-origin game iframe with ?autostart=1, which starts the
 *   camera + detection inside the game. Leaving the route unmounts the iframe,
 *   which releases the camera stream.
 */
export function GameStage({ consent }: { consent: string }) {
  const [started, setStarted] = useState(false);
  const [navH, setNavH] = useState(60);

  useEffect(() => {
    const measure = () =>
      setNavH(document.querySelector("header")?.offsetHeight ?? 60);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      style={{ height: "100svh", paddingTop: navH }}
      className="flex flex-col bg-black"
    >
      <div className="relative flex-1">
        {started ? (
          <iframe
            src="/stock-game/index.html?autostart=1"
            title="Market Pulse Terminal"
            allow="camera"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <Gate consent={consent} onStart={() => setStarted(true)} />
        )}
      </div>
    </div>
  );
}

function Gate({ consent, onStart }: { consent: string; onStart: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center px-6 text-center font-mono">
      <div className="flex max-w-md flex-col items-center gap-5">
        <Link
          href="/#work"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8a8a8a] transition-colors hover:text-[#e8e8e8]"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to work
        </Link>

        <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffa028]">
          Market Pulse Terminal
        </p>
        <h1 className="font-sans text-2xl font-medium tracking-tight text-[#e8e8e8] sm:text-3xl">
          Trade a live market with your face.
        </h1>
        <p className="max-w-sm text-[12px] leading-relaxed text-[#8a8a8a]">
          {consent}
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-1 inline-flex items-center gap-2 border border-[#ffa028] bg-[#ffa028] px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-black transition-colors hover:bg-[#ffb24f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffa028]"
        >
          ▶ Start terminal
        </button>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#5a5a5a]">
          Camera starts only after you press Start
        </p>
      </div>
    </div>
  );
}
