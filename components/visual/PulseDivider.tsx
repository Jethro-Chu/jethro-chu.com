"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { ecgPath } from "@/lib/ecg";
import { cn } from "@/lib/utils";

/**
 * A thin single-line ECG rule used between major sections instead of a
 * plain <hr>. Carries the heartbeat through the scroll; draws once when it
 * enters the viewport, then stays static. Structural (line-strong), no amber.
 */
export function PulseDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const width = 1200;
  const height = 44;
  const { d } = ecgPath({
    width,
    height,
    beats: 1,
    beatWidth: 190,
    startGap: 0.4,
    endGap: 0.04,
    baseline: 0.5,
    amp: 13,
  });

  return (
    <div
      ref={ref}
      className={cn("h-11 w-full", inView ? "wipe-in" : "wipe-pre", className)}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        <path
          d={d}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
