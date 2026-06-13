const phrases = [
  "Healthcare UX",
  "AI that tells the truth",
  "Design systems",
  "Clinical workflows",
  "Motion & craft",
  "Shipped, not slideware",
  "Evidence-based",
  "Privacy-first",
];

/** Infinite, hover-pausable marquee that bridges hero → work. */
export function Marquee() {
  return (
    <section
      aria-hidden
      className="relative border-y border-line/60 bg-ink-2/50 py-5"
    >
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />

      <div className="marquee-track gap-8">
        {[...phrases, ...phrases].map((p, i) => (
          <div key={i} className="flex items-center gap-8">
            <span className="whitespace-nowrap font-display text-xl text-bone-dim sm:text-2xl">
              {p}
            </span>
            <span className="text-iris">✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}
