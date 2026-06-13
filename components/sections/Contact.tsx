import { ArrowUpRight } from "lucide-react";
import { site, socials, hero } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <span className="eyebrow">Panel 03 · Contact</span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <h2 className="max-w-xl text-balance font-display text-display font-medium">
                Building something in healthcare or AI? I&apos;d like to hear about it.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <a
                href={`mailto:${site.email}`}
                className="link-underline mt-8 inline-block font-display text-2xl font-medium text-ink sm:text-3xl"
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
                        className="size-4 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                        strokeWidth={1.75}
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {hero.availability}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
