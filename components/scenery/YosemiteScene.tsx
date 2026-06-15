"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

/**
 * The Yosemite ascent, rebuilt as a composed, layered atmosphere rather than a
 * literal 3D flythrough. Half Dome is drawn as depth-separated granite
 * silhouettes (a hazy far ridge, the dome massif, a dark near ridge) over a
 * graded valley sky — a quiet national-park-poster composition in the site's own
 * palette. As you scroll the camera does ONE calm thing: a slow push toward the
 * dome with gentle parallax and a warming golden-hour light, then the whole
 * scene dissolves into the page's sand wash before the projects, so the work
 * sits on a clean editorial canvas, never "inside the mountain". It is pure
 * CSS/SVG: no asset bloat, no clipping, beautiful as a still. Reduced motion
 * holds the composed frame and only fades it out; the mountains never move.
 */

/* iconic Half Dome profile (sheer NW face at left, rounded summit, long shoulder
   sloping to the right valley). Authored at viewBox 1440x960, anchored to the
   bottom; preserveAspectRatio slices the sides on narrower screens. */
const MASSIF =
  "M-60 960 L-60 720 C150 706 332 694 470 656 C548 634 600 596 620 504 " +
  "L638 356 C648 286 690 240 776 238 C918 236 1024 298 1104 440 " +
  "C1190 588 1330 652 1500 676 L1500 960 Z";
/* sun-lit crest: summit + right shoulder, picked out by the low light */
const RIM =
  "M638 356 C648 286 690 240 776 238 C918 236 1024 298 1104 440 C1190 588 1330 652 1500 676";
const FAR =
  "M-60 960 L-60 786 C220 752 470 768 720 732 C1000 694 1210 728 1500 708 L1500 960 Z";
const FAR2 =
  "M-60 960 L-60 838 C260 814 520 830 800 808 C1060 788 1260 812 1500 800 L1500 960 Z";
const NEAR =
  "M-60 960 L-60 862 C220 832 410 872 620 846 C860 816 1030 866 1260 838 " +
  "L1500 856 L1500 960 Z";

/* a fixed, static film grain (rendered once as a data URI, costs nothing) */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

/** Measured hero progress: 0 at the top, 1 when the projects section reaches the
 *  top of the viewport. Drives every layer so the beats stay pinned to content. */
function useHeroProgress(): MotionValue<number> {
  const { scrollY } = useScroll();
  const [end, setEnd] = useState(1200);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("projects");
      const top = el
        ? el.getBoundingClientRect().top + window.scrollY
        : window.innerHeight;
      setEnd(Math.max(1, top));
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return useTransform(scrollY, [0, end], [0, 1], { clamp: true });
}

function FullBleedSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1440 960"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {children}
    </svg>
  );
}

export function YosemiteScene() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hero = useHeroProgress();
  const animated = mounted && !reduce;

  // the whole scene dissolves into the page's sand wash across the approach
  // section, so the intro reads cleanly and the projects land on bare sand
  const sceneOpacity = useTransform(hero, [0.46, 0.82], [1, 0]);
  // slow push toward the dome + a real rise (foreground sinks away beneath it)
  const domeScale = useTransform(hero, [0, 1], [1, 1.08]);
  const domeY = useTransform(hero, [0, 1], ["0%", "-3%"]);
  const farY = useTransform(hero, [0, 1], ["0%", "-1.4%"]);
  const nearY = useTransform(hero, [0, 1], ["0%", "8%"]);
  const hazeX = useTransform(hero, [0, 1], ["-2%", "7%"]);
  const hazeOpacity = useTransform(hero, [0, 0.5, 1], [0.55, 0.34, 0]);
  // light warms toward golden hour as the climb gains elevation
  const glow = useTransform(hero, [0, 0.5, 1], [0.04, 0.26, 0.52]);
  const rim = useTransform(hero, [0, 0.55, 1], [0.14, 0.45, 0.82]);

  // composed (reduced-motion / first-paint) static frame
  const sGlow = 0.22;
  const sRim = 0.4;
  const sHaze = 0.45;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: mounted ? sceneOpacity : 1 }}
    >
      {/* valley sky: a cool wash up top that fades to the page sand by mid-frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom," +
            " color-mix(in oklab, var(--color-sky) 34%, var(--color-sand)) 0%," +
            " color-mix(in oklab, var(--color-sky) 11%, var(--color-sand)) 28%," +
            " transparent 54%)",
        }}
      />

      {/* far ridges: atmospheric perspective, hazed toward the sky */}
      <motion.div
        className="absolute inset-0"
        style={animated ? { y: farY } : undefined}
      >
        <FullBleedSvg>
          <path
            d={FAR2}
            fill="color-mix(in oklab, var(--color-shadow) 11%, var(--color-sand))"
          />
          <path
            d={FAR}
            fill="color-mix(in oklab, var(--color-shadow) 20%, var(--color-sand))"
          />
        </FullBleedSvg>
      </motion.div>

      {/* Half Dome: the massif (lit-crest -> shadowed base), a sun-shaded NW face,
          and the warm crest edge that strengthens toward golden hour */}
      <motion.div
        className="absolute inset-0 origin-bottom"
        style={animated ? { y: domeY, scale: domeScale } : undefined}
      >
        <FullBleedSvg>
          <defs>
            <linearGradient id="granite" x1="0" y1="0.1" x2="0.12" y2="1">
              <stop
                offset="0%"
                stopColor="color-mix(in oklab, var(--color-granite) 78%, var(--color-horizon) 22%)"
              />
              <stop
                offset="24%"
                stopColor="color-mix(in oklab, var(--color-granite) 86%, var(--color-shadow) 14%)"
              />
              <stop
                offset="52%"
                stopColor="color-mix(in oklab, var(--color-granite) 46%, var(--color-shadow) 54%)"
              />
              <stop
                offset="100%"
                stopColor="color-mix(in oklab, var(--color-shadow) 88%, var(--color-granite) 12%)"
              />
            </linearGradient>
            <linearGradient id="sun" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-shadow)" stopOpacity="0.4" />
              <stop offset="44%" stopColor="var(--color-shadow)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={MASSIF} fill="url(#granite)" />
          <path d={MASSIF} fill="url(#sun)" />
          <motion.path
            d={RIM}
            stroke="var(--color-horizon)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ opacity: animated ? rim : sRim }}
          />
        </FullBleedSvg>
      </motion.div>

      {/* a thin valley haze where the dome base meets the near ridge: atmospheric
          separation between the layers (poster depth), drifting and thinning */}
      <motion.div
        className="absolute inset-x-[-8%] top-[68%] h-[14%]"
        style={{
          x: animated ? hazeX : undefined,
          opacity: animated ? hazeOpacity : sHaze,
          filter: "blur(26px)",
          background:
            "linear-gradient(to bottom," +
            " transparent 0%," +
            " color-mix(in oklab, var(--color-card) 80%, transparent) 50%," +
            " transparent 100%)",
        }}
      />

      {/* near ridge: the closest, darkest layer, sinking away as the climb rises */}
      <motion.div
        className="absolute inset-0"
        style={animated ? { y: nearY } : undefined}
      >
        <FullBleedSvg>
          <path
            d={NEAR}
            fill="color-mix(in oklab, var(--color-shadow) 72%, var(--color-pine) 28%)"
          />
        </FullBleedSvg>
      </motion.div>

      {/* golden-hour sky wash (top) — strengthens with the climb */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: animated ? glow : sGlow,
          background:
            "linear-gradient(to bottom," +
            " color-mix(in oklab, var(--color-horizon) 44%, transparent) 0%," +
            " color-mix(in oklab, var(--color-horizon) 12%, transparent) 24%," +
            " transparent 46%)",
        }}
      />
      {/* alpenglow (low) — warm light pooling in the valley at golden hour */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: animated ? glow : sGlow,
          background:
            "radial-gradient(120% 80% at 50% 106%," +
            " color-mix(in oklab, var(--color-horizon-low) 42%, transparent) 0%," +
            " transparent 58%)",
        }}
      />

      {/* sand veil: lifts the centered title off the granite, thins to the gutters */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(82% 56% at 50% 45%," +
            " color-mix(in oklab, var(--color-sand) 52%, transparent) 0%," +
            " color-mix(in oklab, var(--color-sand) 22%, transparent) 46%," +
            " transparent 74%)",
        }}
      />

      {/* soft corner vignette: frames the composition, editorial not heavy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 110% at 50% 40%," +
            " transparent 58%," +
            " color-mix(in oklab, var(--color-shadow) 9%, transparent) 85%," +
            " color-mix(in oklab, var(--color-shadow) 16%, transparent) 100%)",
        }}
      />

      {/* film grain: a static, near-invisible filmic texture for cohesion */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
      />
    </motion.div>
  );
}
