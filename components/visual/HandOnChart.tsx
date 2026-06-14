import { cn } from "@/lib/utils";

/**
 * The one human illustration: a clinician's bedside clipboard with a live
 * vitals trace, held at the corner. Spare line drawing, no face, no gloss.
 * Outline = currentColor; the pulse = --color-primary with one amber R-peak.
 */
export function HandOnChart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 150"
      fill="none"
      className={cn("h-auto w-full", className)}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* board */}
      <rect x="16" y="16" width="100" height="118" rx="7" />
      {/* clip */}
      <rect x="50" y="8" width="32" height="13" rx="3" />
      <path d="M58 8 V5 a8 8 0 0 1 16 0 V8" strokeWidth={1.6} />
      {/* title rule + folio */}
      <path d="M28 38 H104" strokeOpacity={0.5} />
      <path d="M28 47 H70" strokeOpacity={0.4} strokeWidth={1.5} />
      <path d="M28 53 H58" strokeOpacity={0.4} strokeWidth={1.5} />
      {/* vitals trace */}
      <path
        d="M28 78 H44 L50 64 L57 96 L63 78 H104"
        stroke="var(--color-primary)"
        strokeWidth={2.25}
      />
      <circle cx="50" cy="64" r="2.4" fill="var(--color-amber)" stroke="none" />
      {/* reference range cells */}
      <g strokeWidth={1.4} strokeOpacity={0.55}>
        <rect x="28" y="104" width="8" height="11" />
        <rect x="39" y="104" width="8" height="11" />
        <rect x="50" y="104" width="8" height="11" />
        <rect x="61" y="104" width="8" height="11" />
        <rect x="72" y="104" width="8" height="11" />
      </g>
      <g fill="var(--color-primary)" stroke="none" fillOpacity={0.85}>
        <rect x="28" y="104" width="8" height="11" />
        <rect x="39" y="104" width="8" height="11" />
        <rect x="50" y="104" width="8" height="11" />
      </g>
      {/* a thumb holding the board at the lower-left edge */}
      <path
        d="M16 120 q-9 1 -11 9 q-1 6 6 7 q10 1 13 -6"
        fill="var(--color-surface)"
        strokeWidth={1.8}
      />
    </svg>
  );
}
