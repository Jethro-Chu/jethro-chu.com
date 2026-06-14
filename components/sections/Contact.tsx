import { ArrowUpRight } from "lucide-react";
import { site, socials, hero, contact } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { VitalsWaveform } from "@/components/visual/VitalsWaveform";

/**
 * Contact, continuous with the deep-pine band (one breathing dark zone with
 * About + Footer). The hero's waveform finally settles to a calm RESTING
 * baseline above the email: one last beat, never a flatline.
 */
export function Contact() {
  return (
    <section
      id="contact"
      className="on-deep scroll-mt-16 px-6 pb-24 pt-10 sm:px-8 sm:pb-28 lg:px-16"
    >
      <div className="mx-auto max-w-[1280px]">
        {/* the trace settles: one beat, then a calm resting baseline */}
        <div className="h-12 sm:h-16" aria-hidden>
          <VitalsWaveform
            height={120}
            beats={1}
            beatWidth={300}
            startGap={0.04}
            endGap={0.46}
            strokeWidth={2}
          />
        </div>

        <Reveal>
          <span className="eyebrow">Contact</span>
        </Reveal>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <h2 className="max-w-xl text-balance font-display text-display font-medium text-ink">
                {contact.headline}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                {contact.blurb}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <a
                href={`mailto:${site.email}`}
                className="link-underline mt-8 inline-block font-display text-2xl font-medium text-primary sm:text-3xl"
              >
                {site.email}
              </a>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="eyebrow mb-4 border-b border-line pb-2">Elsewhere</p>
              <ul className="divide-y divide-line border-b border-line">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center justify-between py-3.5"
                    >
                      <span className="text-ink">{s.label}</span>
                      <ArrowUpRight
                        className="size-4 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                        strokeWidth={1.75}
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                <span className="size-1.5 rounded-full bg-primary" />
                {hero.availability}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
