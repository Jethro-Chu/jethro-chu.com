import { cn } from "@/lib/utils";

/**
 * The brand mark: a clinical "pulse tile". An ink rounded square holding
 * one teal heartbeat with a single amber R-peak dot, echoing the favicon
 * and the hero waveform. The wordmark carries the name; the mark carries
 * the heartbeat (nurse) inside a built square (builder).
 *
 *  - variant "tile" (default): the ink lockup square, for nav/footer.
 *  - variant "line": just the beat in currentColor, for inline use.
 */
export function NurseBuilderMonogram({
  className,
  size = 30,
  variant = "tile",
}: {
  className?: string;
  size?: number;
  variant?: "tile" | "line";
}) {
  if (variant === "line") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M2 17 H8 L11 8 L14 24 L17 17 L20 13 L22 17 H30"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="var(--color-ink)" />
      <path
        d="M5 18.5 H10 L12 10 L14.5 24 L16.5 18.5 L19 14.5 L21 18.5 H27"
        stroke="var(--color-primary-mark)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="1.7" fill="var(--color-amber)" />
    </svg>
  );
}
