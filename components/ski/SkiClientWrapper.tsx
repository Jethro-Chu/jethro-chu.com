"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WokAndSkisGame = dynamic(
  () => import("./WokAndSkisPage"),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans select-none">
        <div className="text-xl font-bold tracking-wider mb-2 text-amber-400 animate-pulse">PREPARING WOK &amp; SKIS…</div>
        <div className="text-xs text-slate-400">Loading Three.js alpine physics simulation</div>
      </div>
    ),
  }
);

export function SkiClientWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans select-none">
        <div className="text-xl font-bold tracking-wider mb-2 text-amber-400 animate-pulse">PREPARING WOK &amp; SKIS…</div>
        <div className="text-xs text-slate-400">Loading Three.js alpine physics simulation</div>
      </div>
    );
  }

  return <WokAndSkisGame />;
}
