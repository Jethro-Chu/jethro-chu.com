import { about, aboutBeats, capabilities } from "@/lib/site";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Flowsheet } from "@/components/visual/Flowsheet";
import { HandOnChart } from "@/components/visual/HandOnChart";

/**
 * About / credibility, on the one compositional deep-pine band (.on-deep
 * remaps the tokens so reused components invert automatically). The story
 * gains gravity; the page breathes light to dark in a single scroll.
 */
export function About() {
  return (
    <section
      id="about"
      className="on-deep scroll-mt-16 px-6 py-24 sm:px-8 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading eyebrow="About" title={about.title} />

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* narrative */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="max-w-2xl text-balance font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
                {about.lead}
              </p>
            </Reveal>

            {/* nursing-student-to-builder beats, along a lead-wire spine */}
            <div className="relative mt-14 pl-8">
              <span
                aria-hidden
                className="absolute bottom-2 left-[3px] top-2 w-px"
                style={{ background: "var(--color-line-strong)" }}
              />
              <RevealGroup className="flex flex-col gap-9">
                {aboutBeats.map((beat) => (
                  <RevealItem key={beat.title} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-8 top-1.5 size-[9px] rounded-full"
                      style={{
                        background: "var(--color-primary)",
                        // a ring in the band ground so the node reads as sitting on the wire
                        boxShadow: "0 0 0 4px var(--color-primary-deep)",
                      }}
                    />
                    <span
                      className="font-mono text-[11px] uppercase tracking-[0.16em]"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {beat.year}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-medium text-ink">
                      {beat.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted">
                      {beat.body}
                    </p>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>

          {/* credentials + capabilities */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="mx-auto w-40 text-ink sm:w-44" aria-hidden>
                <HandOnChart />
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="mt-8 rounded-[var(--radius-sm)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
                <Flowsheet />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10">
                <p className="eyebrow mb-3 border-b border-line pb-2">Capabilities</p>
                <dl className="divide-y divide-line">
                  {capabilities.map((c) => (
                    <div key={c.group} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
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
