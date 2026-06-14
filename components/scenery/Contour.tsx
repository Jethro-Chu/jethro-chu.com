/**
 * Topographic contour lines — the recurring quiet map motif. Decorative,
 * so it carries currentColor and is aria-hidden. Keep opacity low wherever
 * it is used so it never competes with text.
 */
export function Contour({
  className,
  opacity = 0.5,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      fill="none"
      style={{ opacity }}
    >
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M0 70 Q200 30 400 60 T800 56 T1200 62" />
        <path d="M0 84 Q200 48 400 76 T800 72 T1200 80" />
        <path d="M0 98 Q200 66 400 92 T800 90 T1200 98" />
        <path d="M0 56 Q260 22 520 48 T1040 44 T1200 50" />
      </g>
    </svg>
  );
}
