import { aboutBeats, capabilities } from "@/lib/site";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Flowsheet } from "@/components/visual/Flowsheet";

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-surface px-6 py-20 sm:px-8 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Panel 02 · Profile"
          title="A nurse who builds the software he wished he'd had on shift."
        />

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* narrative */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="max-w-2xl text-balance font-display text-2xl font-medium leading-snug sm:text-3xl">
                I spent years at the bedside before I wrote production code. That
                order is the point — I design for the person holding the chart at
                3am, not the spec.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-6 max-w-xl text-pretty leading-relaxed text-muted">
                Nursing taught me what most software forgets: the stakes are human,
                trust is earned in small details, and a confusing screen at 3am
                isn&apos;t a UX nitpick — it&apos;s a safety issue. Lab Logger and NurseJet
                both came out of that.
              </p>
            </Reveal>

            {/* timeline beats */}
            <RevealGroup className="mt-12 divide-y divide-line border-t border-line">
              {aboutBeats.map((beat) => (
                <RevealItem
                  key={beat.title}
                  className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr] sm:gap-6"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
                    {beat.year}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-medium">{beat.title}</h3>
                    <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted">
                      {beat.body}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* signature + capabilities */}
          <div className="lg:col-span-5">
            <Reveal>
              <Flowsheet />
            </Reveal>

            <Reveal delay={0.05}>
              <div className="mt-12">
                <p className="eyebrow mb-3 border-b border-line pb-2">Capabilities</p>
                <dl className="divide-y divide-line">
                  {capabilities.map((c) => (
                    <div
                      key={c.group}
                      className="grid grid-cols-[7rem_1fr] gap-4 py-3"
                    >
                      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                        {c.group}
                      </dt>
                      <dd className="text-sm leading-relaxed text-ink">
                        {c.items.join(" · ")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
