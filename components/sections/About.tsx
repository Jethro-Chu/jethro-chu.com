import { aboutBeats, site } from "@/lib/site";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

export function About() {
  return (
    <section id="about" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          {/* left: portrait + identity */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="relative">
                <Portrait />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-6 flex flex-col gap-1">
                <p className="font-display text-2xl tracking-tight">{site.name}</p>
                <p className="text-sm text-bone-dim">{site.role}</p>
                <p className="mt-2 font-mono text-xs text-bone-faint">
                  {site.location}
                </p>
              </div>
            </Reveal>
          </div>

          {/* right: narrative */}
          <div>
            <Reveal y={16}>
              <div className="inline-flex items-center gap-2.5">
                <span className="h-px w-8 bg-gradient-to-r from-iris to-transparent" />
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
                  03 — About
                </span>
              </div>
            </Reveal>

            <Reveal y={22} delay={0.05}>
              <p className="mt-7 text-balance font-display text-3xl leading-[1.15] tracking-tight sm:text-4xl">
                I spent years at the{" "}
                <span className="italic text-gradient">bedside</span> before I wrote
                a line of production code. That order matters — I design for the
                person holding the chart, not the spec.
              </p>
            </Reveal>

            <Reveal y={20} delay={0.1}>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-bone-dim">
                Nursing taught me what most software forgets: that the stakes are
                human, that trust is earned in small details, and that a confusing
                interface at 3am isn&apos;t a UX nitpick — it&apos;s a safety issue. I build
                products that respect that.
              </p>
            </Reveal>

            {/* timeline beats */}
            <RevealGroup className="mt-12 flex flex-col gap-px overflow-hidden rounded-2xl border border-line/60">
              {aboutBeats.map((beat) => (
                <RevealItem
                  key={beat.title}
                  className="group relative grid grid-cols-[auto_1fr] gap-5 bg-surface/30 p-6 transition-colors hover:bg-surface/60 sm:grid-cols-[8rem_1fr] sm:p-7"
                >
                  <span className="font-mono text-xs uppercase tracking-wider text-iris-soft">
                    {beat.year}
                  </span>
                  <div>
                    <h3 className="font-display text-xl tracking-tight">
                      {beat.title}
                    </h3>
                    <p className="mt-2 text-pretty text-[15px] leading-relaxed text-bone-dim">
                      {beat.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Abstract monogram portrait — placeholder until a real photo lands. */
function Portrait() {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-line/60">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,#6d5ef855,transparent_55%),radial-gradient(90%_80%_at_100%_100%,#4fd9c844,transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-[9rem] leading-none text-bone/90">
          JC
        </span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <span className="rounded-full glass px-3 py-1 font-mono text-[11px] text-bone-dim">
          Portrait — placeholder
        </span>
        <span className="size-2.5 animate-[float_6s_ease-in-out_infinite] rounded-full bg-aqua" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
    </div>
  );
}
