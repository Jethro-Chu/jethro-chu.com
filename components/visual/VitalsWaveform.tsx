"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { ecgPath } from "@/lib/ecg";
import { cn } from "@/lib/utils";

/**
 * The signature: a real lead-II ECG trace that draws ONCE when it scrolls
 * into view (clip-path wipe; reduced-motion → static) and parks one amber
 * R-peak tick. Gating on view (not mount) means below-the-fold instances
 * (Contact's resting beat) actually land on screen. Stroke binds to
 * --color-primary so it recolors on the deep band and per project. Fills
 * its container (preserveAspectRatio="none" + non-scaling-stroke keeps the
 * line crisp at any width).
 */
export function VitalsWaveform({
  className,
  width = 1200,
  height = 160,
  beats = 1,
  beatWidth,
  startGap = 0.05,
  endGap = 0.05,
  baseline = 0.5,
  amp,
  strokeWidth = 2,
  draw = true,
  rPeak = true,
  rPeakIndex = 0,
  stroke = "var(--color-primary)",
  title,
}: {
  className?: string;
  width?: number;
  height?: number;
  beats?: number;
  beatWidth?: number;
  startGap?: number;
  endGap?: number;
  baseline?: number;
  amp?: number;
  strokeWidth?: number;
  draw?: boolean;
  rPeak?: boolean;
  rPeakIndex?: number;
  stroke?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const { d, rPeaks } = ecgPath({
    width,
    height,
    beats,
    beatWidth,
    startGap,
    endGap,
    baseline,
    amp: amp ?? height * 0.34,
  });
  const r = rPeaks[Math.min(rPeakIndex, rPeaks.length - 1)];

  return (
    <div
      ref={ref}
      className={cn(
        "h-full w-full overflow-hidden",
        draw && (inView ? "wipe-in" : "wipe-pre"),
        className
      )}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {rPeak && r && (
          <>
            <line
              x1={r.x}
              y1={r.y - 10}
              x2={r.x}
              y2={r.y + 10}
              stroke="var(--color-amber)"
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={r.x} cy={r.y} r={4} fill="var(--color-amber)" />
          </>
        )}
      </svg>
    </div>
  );
}
