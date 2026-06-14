/**
 * The light of the climb, as one page-tall vertical wash: cool midday blue at
 * the valley floor (top of the page), warming through sand to golden-hour at the
 * summit (bottom). Because it spans the whole document and the viewport reveals
 * a slice of it, the light tracks the climb as you scroll, with no JS. Every
 * stop is a light, sand-dominant tint so dark text stays AA on top of it.
 * Server-rendered, so it is the reduced-motion fallback as-is. The scroll-linked
 * alpenglow in LightSweep layers on top for the orchestrated motion moment.
 */
export function BackgroundGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-20"
      style={{
        background:
          "linear-gradient(180deg," +
          " color-mix(in oklab, var(--color-sky) 20%, var(--color-sand)) 0%," +
          " var(--color-sand) 28%," +
          " var(--color-sand) 50%," +
          " color-mix(in oklab, var(--color-horizon) 16%, var(--color-sand)) 82%," +
          " color-mix(in oklab, var(--color-horizon-low) 22%, var(--color-sand)) 100%)",
      }}
    />
  );
}
