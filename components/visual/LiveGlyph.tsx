import { cn } from "@/lib/utils";

/**
 * A tiny hand-drawn amber pulse tick: the "LIVE" / "Open live" marker.
 * Explicitly NOT a glowing status-dot pill. Amber here is a graphic mark
 * (allowed); any accompanying "LIVE" text uses --color-amber-ink for AA.
 */
export function LiveGlyph({
  className,
  size = 15,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M1 12.5 H6 L8.5 6 L11.5 18.5 L14 9.5 L15.8 12.5 H23"
        stroke="var(--color-amber)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
