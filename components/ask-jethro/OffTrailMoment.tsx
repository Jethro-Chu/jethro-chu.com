"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The "off the trail" moment shown when a visitor asks something obviously
 * unrelated to Jethro / his work / the site. A small field-guide scene: the
 * route line branches off-path, a marker drifts away and returns, and two
 * contour rings ripple where it left the trail. Never calls Gemini. Under
 * reduced motion it renders the same scene, static. ~1.1s of calm motion.
 */
type OffTrailAction = "projects" | "resume" | "about";

const actionBtn =
  "inline-flex items-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

export function OffTrailMoment({ onAction }: { onAction: (a: OffTrailAction) => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)]">
      {/* the scene */}
      <div className="border-b border-[var(--color-granite-line)] bg-[var(--color-sand)] px-4 pb-2 pt-3">
        <p className="label-mono mb-1.5 text-[0.6rem] text-[var(--color-pine)]">off trail</p>
        <OffTrailScene reduce={!!reduce} />
      </div>

      {/* copy + actions */}
      <div className="px-4 py-3.5">
        <p className="text-[0.92rem] leading-relaxed text-[var(--color-shadow)]">
          That&apos;s off the portfolio trail. I&apos;m built to answer questions about Jethro, his projects, resume,
          healthcare AI work, and how he builds.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={() => onAction("projects")} className={actionBtn}>
            View projects
          </button>
          <button onClick={() => onAction("resume")} className={actionBtn}>
            My resume
          </button>
          <button onClick={() => onAction("about")} className={actionBtn}>
            Ask about Jethro
          </button>
        </div>
      </div>
    </div>
  );
}

/* the topographic scene: base trail, a faint contour above and below, an
   off-trail dashed branch, a drifting marker, and two ripple rings. */
function OffTrailScene({ reduce }: { reduce: boolean }) {
  const line = "var(--color-granite-line)";
  return (
    <svg viewBox="0 0 280 64" className="h-14 w-full" fill="none" aria-hidden>
      {/* faint contour hints (static, subtle topo) */}
      <path d="M4 22 C 70 14, 150 18, 276 12" stroke={line} strokeOpacity="0.4" strokeWidth="1" />
      <path d="M4 54 C 70 48, 150 52, 276 48" stroke={line} strokeOpacity="0.4" strokeWidth="1" />

      {/* the route / trail */}
      <path d="M6 38 C 70 30, 124 34, 276 28" stroke={line} strokeWidth="1.5" strokeLinecap="round" />

      {/* off-trail branch (dashed pine) */}
      <motion.path
        d="M150 33 C 166 41, 180 46, 188 56"
        stroke="var(--color-pine)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? { pathLength: 1, opacity: 0.55 } : { pathLength: 1, opacity: 0.6 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.15, ease: "easeOut" }}
      />

      {/* ripple rings where the marker leaves the trail */}
      {!reduce &&
        [0, 1].map((i) => (
          <motion.circle
            key={i}
            cx="188"
            cy="56"
            fill="none"
            stroke="var(--color-pine)"
            strokeWidth="1"
            initial={{ r: 2, opacity: 0 }}
            animate={{ r: [2, 13], opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.9, delay: 0.55 + i * 0.18, ease: "easeOut" }}
          />
        ))}

      {/* the marker: rests off-trail under reduced motion, otherwise drifts away and back */}
      <motion.circle
        r="3.4"
        fill="var(--color-golden)"
        stroke="var(--color-sand)"
        strokeWidth="1"
        initial={reduce ? { cx: 188, cy: 56 } : { cx: 150, cy: 33 }}
        animate={
          reduce
            ? { cx: 188, cy: 56 }
            : { cx: [150, 170, 188, 188, 170, 150], cy: [33, 45, 56, 56, 45, 33] }
        }
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 1.15, times: [0, 0.25, 0.45, 0.6, 0.8, 1], ease: "easeInOut", delay: 0.15 }
        }
      />
    </svg>
  );
}
