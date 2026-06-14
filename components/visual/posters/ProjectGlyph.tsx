import { cn } from "@/lib/utils";

/**
 * Bespoke per-project instrument glyphs. One coherent line language:
 * 1.75px single-weight strokes, round caps, a 48px grid. Outline binds to
 * currentColor; the live/data accent binds to --color-primary and the
 * "watch" mark to --color-amber, so each glyph recolors to its project
 * theme automatically. No logos. lucide is reserved for generic UI chrome.
 */
export function ProjectGlyph({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-12 w-12", className)}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[slug] ?? GLYPHS.fallback}
    </svg>
  );
}

const GLYPHS: Record<string, React.ReactNode> = {
  /* Lab Logger: a graduated vial with a meniscus + an amber "Beta" watch mark. */
  "lab-logger": (
    <>
      <path d="M19 7 H29" />
      <path d="M20.5 7 V31 a3.5 3.5 0 0 0 7 0 V7" />
      <path
        d="M20.5 20 V31 a3.5 3.5 0 0 0 7 0 V20 Z"
        fill="var(--color-primary)"
        fillOpacity={0.18}
        stroke="none"
      />
      <path d="M20.5 20 H27.5" stroke="var(--color-primary)" />
      <path d="M16.5 12 H19" />
      <path d="M16.5 16 H19" />
      <path d="M16.5 24 H19" />
      <path d="M16.5 28 H19" />
      <circle cx="27.5" cy="20" r="1.6" fill="var(--color-amber)" stroke="none" />
    </>
  ),

  /* Emotion Stock Market: a face-landmark constellation reading toward a candle. */
  "emotion-stock-market": (
    <>
      <circle cx="11" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17" cy="16" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="23" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="29" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="33" r="1.4" fill="var(--color-amber)" stroke="none" />
      <circle cx="21" cy="34" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11 17 Q9 26 16 33 Q21 35 23 30" strokeOpacity={0.5} />
      <path d="M28 19 V35" strokeDasharray="1 3" strokeOpacity={0.5} />
      <path d="M38 12 V36" />
      <rect
        x="34.5"
        y="18"
        width="7"
        height="11"
        rx="1"
        fill="var(--color-primary)"
        fillOpacity={0.2}
        stroke="var(--color-primary)"
      />
    </>
  ),

  /* Cleo: a voice bubble (waveform inside) flowing into a validated vial. */
  cleo: (
    <>
      <path d="M7 11 a3 3 0 0 1 3-3 H24 a3 3 0 0 1 3 3 V20 a3 3 0 0 1-3 3 H14 l-4 5 V23 a3 3 0 0 1-3-3 Z" />
      <path d="M12 13 V18" stroke="var(--color-primary)" />
      <path d="M16 11.5 V19.5" stroke="var(--color-primary)" />
      <path d="M20 14 V17" stroke="var(--color-primary)" />
      <path d="M30 16 H37" strokeOpacity={0.6} />
      <path d="M34.5 13.5 L37.5 16 L34.5 18.5" strokeOpacity={0.6} />
      <path d="M38 22 H44" />
      <path d="M39 22 V32 a3 3 0 0 0 4 0 V22" />
      <path d="M39.5 28.5 L41 30.5 L43.5 26" stroke="var(--color-primary)" />
    </>
  ),

  /* NurseJet: a folded clinical-brief sheet with a dateline + a pulse line. */
  nursejet: (
    <>
      <path d="M11 8 H31 L37 14 V40 H11 Z" />
      <path d="M31 8 V14 H37" />
      <path d="M15 19 H28" strokeOpacity={0.55} />
      <path d="M15 23 H33" strokeOpacity={0.55} />
      <path d="M14 31 H19 L21 27 L23 35 L25 31 H34" stroke="var(--color-primary)" />
      <circle cx="21" cy="27" r="1.5" fill="var(--color-amber)" stroke="none" />
    </>
  ),

  /* RateMyHospitalFood: a meal tray where the steam line doubles as an ECG. */
  ratemyhospitalfood: (
    <>
      <path d="M14 9 L17 5 L19 12 L21 7" stroke="var(--color-primary)" />
      <rect x="7" y="14" width="34" height="25" rx="3" />
      <path d="M21 14 V39" strokeOpacity={0.6} />
      <path d="M7 27 H21" strokeOpacity={0.6} />
      <path d="M26 27 L29 30.5 L34 23.5" stroke="var(--color-primary)" />
    </>
  ),

  fallback: (
    <>
      <rect x="9" y="9" width="30" height="30" rx="3" />
      <path d="M13 28 H19 L22 20 L26 32 L29 24 L31 28 H35" stroke="var(--color-primary)" />
    </>
  ),
};
