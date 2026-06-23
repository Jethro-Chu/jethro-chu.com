"use client";

import { useEffect, useMemo, useState } from "react";
import {
  m,
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
  // gate motion on mount so the static fallback is the deterministic first paint
  // (useReducedMotion is null during SSR / the first client commit)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const measure = () => {
      setTops(
        sections.map((s) => {
          const el = document.getElementById(s.id);
          return el ? el.getBoundingClientRect().top + window.scrollY : NaN;
        })
      );
    };
    measure();
    // re-measure on everything that actually shifts the section tops: fonts
    // loading, the summit image decoding, and any layout change.
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // build a strictly-increasing scroll->elevation map from measured tops,
  // skipping any section whose element was not found (no silent 0s)
  const [inRange, outRange] = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    tops.forEach((y, i) => {
      if (!Number.isFinite(y)) return;
      const x =
        xs.length === 0 ? Math.max(0, y) : Math.max(y, xs[xs.length - 1] + 1);
      xs.push(x);
      ys.push(sections[i].elevation);
    });
    if (xs.length < 2) return [[0, 1], [ELEVATION_START, ELEVATION_START]];
    return [xs, ys];
  }, [tops]);

  const elevation = useTransform(scrollY, inRange, outRange, { clamp: true });
  const railTop = useTransform(
    elevation,
    [ELEVATION_START, ELEVATION_SUMMIT],
    ["12vh", "88vh"]
  );
  const fillScale = useTransform(
    elevation,
    [ELEVATION_START, ELEVATION_SUMMIT],
    [0, 1]
  );
  const readout = useTransform(elevation, (v) =>
    Math.round(v).toLocaleString("en-US")
  );

  if (!mounted || reduce) return null;

  return (
    <>
      {/* desktop: the marker descends the rail with the scroll */}
      <div
        aria-hidden
        className="pointer-events-none fixed right-0 top-0 z-30 hidden h-screen w-40 lg:block"
      >
        <m.div
          className="absolute inset-x-0 top-0"
          style={{ y: railTop, willChange: "transform" }}
        >
          {/* the marker dot, aligned on the track with the junction dots (right-[58px]) */}
          <span className="absolute right-[51px] size-3.5 -translate-y-1/2 rounded-full border-2 border-[var(--color-sand)] bg-[var(--color-pine)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-pine)_22%,transparent)]" />
          {/* the live readout, in the gutter to the right of the track */}
          <span className="tnum absolute right-[4px] -translate-y-1/2 whitespace-nowrap rounded-xs bg-[var(--color-pine)] px-1 py-0.5 text-[0.5rem] tracking-[0.02em] text-[var(--color-on-dark)]">
            <m.span>{readout}</m.span>
            <span className="ml-0.5">ft</span>
          </span>
        </m.div>
      </div>

      {/* mobile: thin top progress bar with live readout */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 lg:hidden">
        <div className="h-[3px] w-full overflow-hidden bg-[var(--color-granite-line)]">
          <m.div
            className="h-full w-full origin-left bg-[var(--color-pine)]"
            style={{ scaleX: fillScale, willChange: "transform" }}
          />
        </div>
        <div className="flex justify-end px-3 pt-1">
          <span className="tnum inline-flex items-center rounded-xs bg-[var(--color-pine)] px-1.5 py-0.5 text-[0.6rem] tracking-[0.02em] text-[var(--color-on-dark)]">
            <m.span>{readout}</m.span>
            <span className="ml-0.5">ft</span>
          </span>
        </div>
      </div>
    </>
  );
}
