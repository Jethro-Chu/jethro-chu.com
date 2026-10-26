"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SkiGameMount = dynamic(
  () => import("./SkiGameMount").then((mod) => mod.SkiGameMount),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#d9ebf7] text-[#2b2114] font-mono select-none">
        <div className="text-xl font-bold tracking-wider mb-2">PREPARING WOK & SKIS…</div>
        <div className="text-xs text-[#5e5749]">Loading Three.js alpine physics simulation</div>
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
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#d9ebf7] text-[#2b2114] font-mono select-none">
        <div className="text-xl font-bold tracking-wider mb-2">PREPARING WOK & SKIS…</div>
        <div className="text-xs text-[#5e5749]">Loading Three.js alpine physics simulation</div>
      </div>
    );
  }

  return <SkiGameMount />;
}
