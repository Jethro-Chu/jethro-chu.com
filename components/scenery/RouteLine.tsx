/**
 * The climbing route: a thin dashed trail down the left gutter, like a route
 * penciled on a topo map. Static by design — a scroll-linked clip-path reveal
 * repaints every frame, so for a smooth scroll the trail is simply drawn in full.
 * Faint, decorative, behind content, desktop only.
 */
export function RouteLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-16 lg:block"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 40 1000"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M20 0 C 12 110, 28 210, 20 320 C 12 430, 30 540, 20 660 C 12 770, 26 880, 20 1000"
          stroke="var(--color-pine)"
          strokeWidth="1.5"
          strokeDasharray="1.5 7"
          strokeLinecap="round"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
