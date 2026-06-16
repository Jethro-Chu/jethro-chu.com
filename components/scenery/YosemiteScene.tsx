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
 * Yosemite Valley as a refined 3D OUTLINED terrain you travel into — not a filled
 * mountain. Thin warm contour lines describe the valley as a stack of nested
 * cross-sections (wide and deep near you, closing toward the distance) with a
 * small Half Dome outline as the destination at the valley's end. On scroll the
 * camera dollies gently forward: the near contours open out and pass while the
 * distant dome draws nearer (layered parallax), then the whole field dissolves
 * into the page's sand before the projects. Pure SVG/CSS, no assets, never a
 * blob; the open sky above keeps the typography the star. Reduced motion holds.
 */

const W = 1440;
const H = 900;
const px = (x: number) => Math.round(x * W * 100) / 100;
const py = (y: number) => Math.round(y * H * 100) / 100;

/** valley cross-section weight: 0 at the center (floor), 1 at the sides (walls) */
const vshape = (x: number) => Math.pow((2 * x - 1) * (2 * x - 1), 0.62);

/** one valley contour at depth d (0 near/wide/deep -> 1 far/high/closed) */
function valley(d: number) {
  const centerY = 0.8 - 0.235 * d;
  const sideY = 0.5 + 0.07 * d;
  const N = 44;
  const pts: string[] = [];
  for (let k = 0; k <= N; k++) {
    const x = k / N;
    const wobble = 0.008 * Math.sin(x * 9 + d * 5) + 0.004 * Math.sin(x * 21 + d);
    const y = centerY - (centerY - sideY) * vshape(x) + wobble;
    pts.push(`${px(x)} ${py(y)}`);
  }
  return "M " + pts.join(" L ");
}
/** filled valley body under the nearest contour, to ground the very bottom */
function valleyFill(d: number) {
  return valley(d) + ` L ${W} ${H} L 0 ${H} Z`;
}
/** the distant Half Dome destination as an open outline (steep face, rounded crest) */
function dome(cx: number, baseY: number, w: number) {
  const x = cx * W;
  const y = baseY * H;
  const s = w * W;
  return (
    `M ${x - 0.46 * s} ${y}` +
    ` L ${x - 0.39 * s} ${y - 0.5 * s}` +
    ` C ${x - 0.38 * s} ${y - 0.72 * s} ${x - 0.16 * s} ${y - 0.82 * s} ${x + 0.03 * s} ${y - 0.82 * s}` +
    ` C ${x + 0.32 * s} ${y - 0.82 * s} ${x + 0.49 * s} ${y - 0.46 * s} ${x + 0.6 * s} ${y}`
  );
}

interface LineDef { d: string; stroke: number; width: number; color: string; fill?: number }
const INK_FAR = "var(--color-granite-line)";
const INK_MID = "color-mix(in oklab, var(--color-muted) 60%, var(--color-pine) 40%)";
const INK_FORE = "color-mix(in oklab, var(--color-shadow) 62%, var(--color-pine) 38%)";

// depth layers, far -> near. each valley() depth gets a contour; near ones crisper.
const FAR_LINES: LineDef[] = [
  { d: valley(0.82), stroke: 0.22, width: 1, color: INK_FAR },
  { d: valley(0.66), stroke: 0.28, width: 1, color: INK_FAR },
];
// the distant dome destination — a desktop/tablet refinement. On a narrow phone
// the viewport crops to the center where it sits, so it is hidden there and the
// valley contours carry the scene on their own.
const DOME_LINES: LineDef[] = [
  { d: dome(0.5, 0.715, 0.118), stroke: 0.5, width: 1.1, color: INK_MID },
  { d: dome(0.5, 0.715, 0.077), stroke: 0.32, width: 1, color: INK_MID },
];
const MID_LINES: LineDef[] = [
  { d: valley(0.5), stroke: 0.34, width: 1.1, color: INK_MID },
  { d: valley(0.36), stroke: 0.42, width: 1.1, color: INK_MID },
];
const FORE_LINES: LineDef[] = [
  { d: valley(0.22), stroke: 0.5, width: 1.3, color: INK_FORE },
  { d: valley(0.08), stroke: 0.62, width: 1.45, color: INK_FORE, fill: 0.06 },
];

// NOTE: no vector-effect:non-scaling-stroke. With it, a CSS-scaled SVG must
// re-rasterize every frame to keep strokes 1px — the main scroll-jank source.
// Plain strokes let each layer promote to a GPU texture and scale for free.
function LineLayer({ lines, className = "" }: { lines: LineDef[]; className?: string }) {
  return (
    <svg
      className={`absolute inset-0 h-full w-full ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {lines.map((l, i) => (
        <g key={i}>
          {l.fill && <path d={valleyFill(0.08)} fill={l.color} fillOpacity={l.fill} />}
          <path
            d={l.d}
            stroke={l.color}
            strokeOpacity={l.stroke}
            strokeWidth={l.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
}

function useHeroProgress(): MotionValue<number> {
  const { scrollY } = useScroll();
  const [end, setEnd] = useState(1200);
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("projects");
      const top = el ? el.getBoundingClientRect().top + window.scrollY : window.innerHeight;
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

const ORIGIN = "50% 56%"; // the valley distance — the camera pushes through it

export function YosemiteScene() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMounted(true);
    // measured ONCE (and on breakpoint change) — never on scroll
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  const hero = useHeroProgress();
  const animated = mounted && !reduce;

  // dissolve LATE (into the approach) so the push keeps going past the hero
  const sceneOpacity = useTransform(hero, [0.55, 0.9], [1, 0]);
  // a pronounced forward dolly: each depth layer scales out of the valley distance
  // at a very different rate (foreground fast, distance slow) for travel-into-it
  // parallax. Front-loaded so the movement is obvious in the first scroll gestures.
  // Mobile uses a lighter envelope (fewer/smaller moves) for a smooth frame rate.
  const farScale = useTransform(hero, [0, 0.55, 1], [1, 1.13, 1.2]);
  const domeScale = useTransform(hero, [0, 0.55, 1], [1, 1.34, 1.62]);
  const midScale = useTransform(hero, [0, 0.55, 1], isMobile ? [1, 1.22, 1.36] : [1, 1.42, 1.68]);
  const foreScale = useTransform(hero, [0, 0.55, 1], isMobile ? [1, 1.36, 1.54] : [1, 1.74, 2.1]);
  const farY = useTransform(hero, [0, 1], ["0%", "-2.6%"]);
  const domeY = useTransform(hero, [0, 1], ["0%", "-6.5%"]);
  const midY = useTransform(hero, [0, 1], ["0%", isMobile ? "2%" : "3.4%"]);
  const foreY = useTransform(hero, [0, 1], ["0%", isMobile ? "5.5%" : "10%"]);
  const sGlow = 0.18;

  // GPU-friendly: promote each moving layer to its own composited texture so the
  // scale/translate run on the compositor (no per-frame SVG re-raster or repaint).
  const lyr = (mv: MotionValue<number>, yv: MotionValue<string>) =>
    animated
      ? { scale: mv, y: yv, transformOrigin: ORIGIN, willChange: "transform", backfaceVisibility: "hidden" as const }
      : undefined;
  // the destination grows and rises in place (its own origin) — climbing toward it
  const domeLyr = animated
    ? { scale: domeScale, y: domeY, transformOrigin: "50% 62%", willChange: "transform", backfaceVisibility: "hidden" as const }
    : undefined;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ opacity: mounted ? sceneOpacity : 1, willChange: "opacity" }}
    >
      {/* sky wash: cool muted sky easing to warm page sand */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom," +
            " color-mix(in oklab, var(--color-sky) 22%, var(--color-sand)) 0%," +
            " color-mix(in oklab, var(--color-sky) 6%, var(--color-sand)) 24%," +
            " var(--color-sand) 58%," +
            " color-mix(in oklab, var(--color-horizon) 9%, var(--color-sand)) 100%)",
        }}
      />

      {/* atmospheric haze pooling at the valley distance */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 26% at 50% 56%," +
            " color-mix(in oklab, var(--color-card) 70%, transparent) 0%," +
            " transparent 72%)",
        }}
      />

      {/* far contours + the distant dome: desktop only (one fewer moving layer on
          mobile, where they read least and cost the most) */}
      <motion.div className="absolute inset-0 hidden md:block" style={lyr(farScale, farY)}>
        <LineLayer lines={FAR_LINES} />
      </motion.div>
      <motion.div className="absolute inset-0 hidden md:block" style={domeLyr}>
        <LineLayer lines={DOME_LINES} />
      </motion.div>
      <motion.div className="absolute inset-0" style={lyr(midScale, midY)}>
        <LineLayer lines={MID_LINES} />
      </motion.div>
      <motion.div className="absolute inset-0" style={lyr(foreScale, foreY)}>
        <LineLayer lines={FORE_LINES} />
      </motion.div>

      {/* a soft sand veil behind the centered title so the type always leads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 44% at 50% 42%," +
            " color-mix(in oklab, var(--color-sand) 46%, transparent) 0%," +
            " color-mix(in oklab, var(--color-sand) 16%, transparent) 54%," +
            " transparent 80%)",
        }}
      />

      {/* a whisper of golden-hour light low in the valley (static — no per-frame work) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: sGlow,
          background:
            "radial-gradient(110% 66% at 50% 110%," +
            " color-mix(in oklab, var(--color-horizon) 38%, transparent) 0%," +
            " transparent 56%)",
        }}
      />
    </motion.div>
  );
}
