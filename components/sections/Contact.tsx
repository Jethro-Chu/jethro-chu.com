import { ArrowUpRight } from "lucide-react";
import { site, socials } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="glass-strong edge-light relative overflow-hidden rounded-[2rem] px-6 py-16 sm:px-14 sm:py-24">
          {/* glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-iris/25 blur-[120px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-aqua/15 blur-[120px]"
          />

          <div className="relative">
            <Reveal y={16}>
              <div className="inline-flex items-center gap-2.5">
                <span className="relative grid size-5 place-items-center">
                  <span className="absolute inline-flex size-2.5 animate-[pulse-ring_3s_ease-out_infinite] rounded-full bg-aqua" />
                  <span className="relative inline-flex size-2 rounded-full bg-aqua" />
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
                  06 — Contact · Open to new work
                </span>
              </div>
            </Reveal>

            <Reveal y={24} delay={0.05}>
              <h2 className="mt-7 max-w-3xl text-balance font-display text-hero leading-[0.95] tracking-tight">
                Let&apos;s make something{" "}
                <span className="italic text-gradient">worth using</span>.
              </h2>
            </Reveal>

            <Reveal y={20} delay={0.1}>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-bone-dim">
                Building in healthcare, AI, or anything that needs to feel
                genuinely good to use? I&apos;d love to hear about it.
              </p>
            </Reveal>

            <Reveal y={20} delay={0.15}>
              <a
                href={`mailto:${site.email}`}
                className="group mt-10 inline-flex items-center gap-4 text-2xl tracking-tight sm:text-4xl"
              >
                <span className="link-underline font-display">{site.email}</span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-bone text-ink transition-transform duration-300 group-hover:rotate-45 sm:size-14">
                  <ArrowUpRight className="size-5 sm:size-6" strokeWidth={2} />
                </span>
              </a>
            </Reveal>

            <Reveal y={20} delay={0.2}>
              <div className="mt-14 flex flex-wrap gap-3 border-t border-line/60 pt-8">
                {socials.map((s) => (
                  <Button
                    key={s.label}
                    href={s.href}
                    external
                    variant="outline"
                    size="sm"
                    arrow
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
