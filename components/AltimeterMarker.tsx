"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { sections, ELEVATION_START, ELEVATION_SUMMIT } from "@/content/content";

/**
 * The live climbing marker and elevation readout, layered onto the static
 * altimeter rail. It maps scroll position to the REAL section elevations (by
 * measuring where each section sits in the document), so the marker passes a
 * junction exactly as you reach that section and the readout plateaus at 8,839
 * across the two summit sections. Pure transform/opacity, scroll-linked, never
 * scroll-jacking. Under reduced motion it renders nothing and the plain rail nav
 * stands in.
 */
export function AltimeterMarker() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [tops, setTops] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => {
      setTops(
        sections.map((s) => {
          const el = document.getElementById(s.id);
          return el ? el.getBoundingClientRect().top + window.scrollY : 0;
        })
      );
    };
    measure();
    // re-measure after fonts/images settle and on resize
    const t = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // build a strictly-increasing scroll->elevation map from measured tops
  const [inRange, outRange] = useMemo(() => {
    if (tops.length < 2) return [[0, 1], [ELEVATION_START, ELEVATION_START]];
    const xs: number[] = [];
    const ys: number[] = [];
    tops.forEach((y, i) => {
      const x = i === 0 ? 0 : Math.max(y, xs[xs.length - 1] + 1);
      xs.push(x);
      ys.push(sections[i].elevation);
    });
    return [xs, ys];
  }, [tops]);

  const elevation = useTransform(scrollY, inRange, outRange, { clamp: true });
  const railTop = useTransform(
    elevation,
    [ELEVATION_START, ELEVATION_SUMMIT],
    ["88vh", "12vh"]
  );
  const fill = useTransform(
    elevation,
    [ELEVATION_START, ELEVATION_SUMMIT],
    ["0%", "100%"]
  );
  const readout = useTransform(elevation, (v) =>
    Math.round(v).toLocaleString("en-US")
  );

  if (reduce) return null;

  return (
    <>
      {/* desktop: marker climbing the rail */}
      <div
        aria-hidden
        className="pointer-events-none fixed right-0 top-0 z-30 hidden h-screen w-32 lg:block"
      >
        <motion.div
          className="absolute right-[16px] flex -translate-y-1/2 items-center gap-2"
          style={{ top: railTop }}
        >
          <span className="label-mono tnum inline-flex items-center rounded-xs bg-[var(--color-pine)] px-1.5 py-0.5 text-[0.66rem] text-white">
            <motion.span>{readout}</motion.span>
            <span className="ml-0.5">ft</span>
          </span>
          <span className="size-3.5 rounded-full border-2 border-[var(--color-sand)] bg-[var(--color-pine)]" />
        </motion.div>
      </div>

      {/* mobile: thin top progress bar with live readout */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 lg:hidden">
        <div className="h-[3px] w-full bg-[var(--color-granite-line)]">
          <motion.div
            className="h-full bg-[var(--color-pine)]"
            style={{ width: fill }}
          />
        </div>
        <div className="flex justify-end px-3 pt-1">
          <span className="label-mono tnum inline-flex items-center rounded-xs bg-[var(--color-pine)] px-1.5 py-0.5 text-[0.6rem] text-white">
            <motion.span>{readout}</motion.span>
            <span className="ml-0.5">ft</span>
          </span>
        </div>
      </div>
    </>
  );
}
