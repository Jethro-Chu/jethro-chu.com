import { profile } from "@/content/profile";
import { Reveal } from "@/components/motion/Reveal";
import { DecodeText } from "@/components/motion/DecodeText";

/**
 * Currently building — a live status panel of what Jethro is actively working on.
 * Editable from profile.currentFocus. Server-rendered; the pulse dot is CSS and
 * is stilled under reduced motion by the global rule.
 */
export function CurrentlyBuilding() {
  return (
    <section
      id="currently-building"
      aria-labelledby="now-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <DecodeText as="p" className="eyebrow" text="Now building" />
        <h2 id="now-heading" className="text-ridge mt-3 text-[var(--color-shadow)]">
          Currently building
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profile.currentFocus.map((f, i) => (
            <Reveal key={f.project} delay={i * 0.06}>
              <article className="h-full rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-pine)] opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-pine)]" />
                  </span>
                  <span className="label-mono text-[var(--color-pine)]">{f.status}</span>
                </div>
                <h3 className="mt-2.5 font-display text-[1.15rem] font-medium text-[var(--color-shadow)]">
                  {f.project}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-shadow)]">
                  <span className="text-[var(--color-muted)]">Improving: </span>
                  {f.improving}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.why}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
