"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * The "off the trail" moment shown when a visitor asks something obviously
 * unrelated to Jethro / his work / the site (never calls Gemini). A small,
 * living field-guide map: the route line flows, contours breathe and drift with
 * the cursor, and a warm marker wanders just off-trail and drifts toward the
 * pointer. Four destinations route the visitor back; picking one walks the
 * marker to that node and shows a "Back on trail" line. Reduced motion renders
 * the same map, static. Transform/opacity only — no canvas, blur, or glow.
 */
type OffTrailAction = "projects" | "resume" | "ask" | "about";

const BASE = { x: 136, y: 54 }; // the marker's home on the main trail

const DESTS: {
  key: OffTrailAction;
  label: string;
  node: { x: number; y: number };
  branch?: string;
  success: string;
}[] = [
  { key: "about", label: "About", node: { x: 60, y: 26 }, branch: "M92 52 C 80 44, 68 35, 60 26", success: "Back on trail: About" },
  { key: "projects", label: "View projects", node: { x: 242, y: 30 }, branch: "M206 49 C 224 42, 234 37, 242 30", success: "Back on trail: Projects" },
  { key: "ask", label: "Ask about Jethro", node: { x: 150, y: 53 }, success: "Back on trail: Ask Jethro" },
  { key: "resume", label: "My resume", node: { x: 250, y: 82 }, branch: "M214 49 C 234 60, 244 71, 250 82", success: "Back on trail: Resume" },
];

const btn =
  "inline-flex items-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

export function OffTrailMoment({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<OffTrailAction | null>(null);
  const [selected, setSelected] = useState<(typeof DESTS)[number] | null>(null);

  // pointer position normalized to -1..1, smoothed
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 90, damping: 18, mass: 0.4 });
  const markerDX = useTransform(sx, (v) => v * 8);
  const markerDY = useTransform(sy, (v) => v * 6);
  const contourDX = useTransform(sx, (v) => v * 5);
  const contourDY = useTransform(sy, (v) => v * 4);
  const trailDX = useTransform(sx, (v) => v * 2.5);

  const onMove = (e: React.PointerEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const pick = (d: (typeof DESTS)[number]) => {
    if (selected) return;
    setSelected(d);
    window.setTimeout(() => onAction(d.key), reduce ? 120 : 470);
  };

  const target = selected?.node;
  const line = "var(--color-granite-line)";

  return (
    <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
      {/* the living map */}
      <div
        className="border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 pb-2.5 pt-3"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <p className="label-mono mb-1.5 text-[0.6rem] text-[var(--color-pine)]">off trail</p>
        <svg viewBox="0 0 300 104" className="h-[6.5rem] w-full select-none" fill="none" aria-hidden>
          {/* contour hints — drift with the cursor and breathe slightly */}
          <motion.g style={reduce ? undefined : { x: contourDX, y: contourDY }}>
            <motion.path
              d="M2 20 C 80 12, 170 16, 298 9"
              stroke={line}
              strokeWidth="1"
              animate={reduce ? undefined : { opacity: [0.32, 0.5, 0.32] }}
              transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
              style={{ opacity: 0.4 }}
            />
            <motion.path
              d="M2 92 C 80 86, 170 90, 298 84"
              stroke={line}
              strokeWidth="1"
              animate={reduce ? undefined : { opacity: [0.5, 0.32, 0.5] }}
              transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
              style={{ opacity: 0.4 }}
            />
          </motion.g>

          {/* the main trail — bends a touch toward the cursor */}
          <motion.path
            style={reduce ? undefined : { x: trailDX }}
            d="M8 60 C 80 50, 150 54, 292 46"
            stroke={line}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* branches to each destination — dashed, gently flowing */}
          {DESTS.map((d) =>
            d.branch ? (
              <motion.path
                key={d.key}
                d={d.branch}
                stroke="var(--color-pine)"
                strokeWidth="1.1"
                strokeDasharray="2.5 4"
                strokeLinecap="round"
                style={{ opacity: hovered === d.key ? 0.85 : 0.4 }}
                animate={reduce ? undefined : { strokeDashoffset: [0, -13] }}
                transition={reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: "linear" }}
              />
            ) : null
          )}

          {/* destination nodes — highlight on hover / selection */}
          {DESTS.map((d) => {
            const active = hovered === d.key || selected?.key === d.key;
            return (
              <motion.circle
                key={d.key}
                cx={d.node.x}
                cy={d.node.y}
                r={active ? 4 : 2.6}
                fill={active ? "var(--color-pine)" : "var(--color-card)"}
                stroke="var(--color-pine)"
                strokeWidth="1.2"
                animate={{ r: active ? 4 : 2.6 }}
                transition={{ duration: 0.2 }}
              />
            );
          })}

          {/* the marker: mouse drift (outer) + idle wander or walk-to-node (inner) */}
          <motion.g style={reduce ? undefined : { x: markerDX, y: markerDY }}>
            <motion.g
              initial={false}
              animate={
                target
                  ? { x: target.x - BASE.x, y: target.y - BASE.y }
                  : reduce
                    ? { x: 14, y: -10 }
                    : { x: [0, 12, -4, 6, 0], y: [0, 9, -5, 3, 0] }
              }
              transition={
                target
                  ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                  : reduce
                    ? { duration: 0 }
                    : { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {!reduce && (
                <motion.circle
                  cx={BASE.x}
                  cy={BASE.y}
                  fill="none"
                  stroke="var(--color-golden)"
                  strokeWidth="1"
                  animate={{ r: [3, 9], opacity: [0.5, 0] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <circle cx={BASE.x} cy={BASE.y} r="3.6" fill="var(--color-golden)" stroke="var(--color-sand)" strokeWidth="1" />
            </motion.g>
          </motion.g>
        </svg>
      </div>

      {/* copy + destinations */}
      <div className="px-4 py-3.5">
        <p className="font-display text-[1.02rem] font-medium leading-snug text-[var(--color-shadow)]">
          You wandered off the portfolio trail.
        </p>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-[var(--color-muted)]">
          I&apos;m built to guide you through Jethro&apos;s projects, resume, clinical background, and healthcare AI work.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DESTS.map((d) => (
            <button
              key={d.key}
              onClick={() => pick(d)}
              onPointerEnter={() => setHovered(d.key)}
              onPointerLeave={() => setHovered(null)}
              className={btn}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="label-mono mt-3 text-[0.6rem] text-[var(--color-pine)]">
          {selected ? selected.success : "Pick a route to get back."}
        </p>
      </div>
    </div>
  );
}
