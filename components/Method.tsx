import Link from "next/link";
import { method } from "@/content/profile";
import { Reveal } from "@/components/motion/Reveal";
import { OpenAskButton } from "@/components/ask-jethro/triggers";
import { DecodeText } from "@/components/motion/DecodeText";

/**
 * Method — how Jethro builds. Replaces the old "why invite me" pitch with a
 * personal, field-guide account of the instinct behind the projects: notice the
 * friction, prototype fast, make it useful. Three editorial cards read as the
 * stages of a route; the copy lives in content/profile.ts (method).
 */
const primaryBtn =
  "inline-flex items-center gap-2 rounded-sm bg-[var(--color-pine)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-on-dark)] transition duration-150 ease-[var(--ease-fast)] hover:bg-[var(--color-pine-deep)] active:scale-[0.98]";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] px-4 py-2.5 font-body text-sm font-medium text-[var(--color-shadow)] transition duration-150 ease-[var(--ease-fast)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]";

export function Method() {
  return (
    <section
      id="method"
      aria-labelledby="method-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <DecodeText as="p" className="eyebrow" text="Method" />
        <h2 id="method-heading" className="text-ridge mt-3 max-w-3xl text-[var(--color-shadow)]">
          {method.title}
        </h2>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-shadow)]">
          {method.intro}
        </p>

        {/* a thin route that climbs across the three stages — a quiet elevation cue */}
        <svg
          viewBox="0 0 800 36"
          fill="none"
          aria-hidden
          className="mt-12 hidden h-7 w-full max-w-3xl sm:block"
          preserveAspectRatio="none"
        >
          <path
            d="M6 30 C 150 24, 230 20, 392 16 S 650 8, 794 6"
            stroke="var(--color-granite-line)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="120" cy="25" r="3.5" fill="var(--color-pine)" />
          <circle cx="400" cy="16" r="3.5" fill="var(--color-pine)" />
          <circle cx="700" cy="7" r="4" fill="var(--color-golden)" />
        </svg>

        <ol className="mt-5 grid gap-5 sm:mt-6 sm:grid-cols-3">
          {method.steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.06} className="h-full">
              <article className="h-full rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="label-mono tnum text-[var(--color-pine)]">{`0${i + 1}`}</span>
                  <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i === method.steps.length - 1 ? "var(--color-golden)" : "var(--color-pine)",
                    }}
                  />
                </div>
                <h3 className="mt-3 font-display text-[1.2rem] font-medium text-[var(--color-shadow)]">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-pretty text-sm leading-relaxed text-[var(--color-muted)]">
                  {s.copy}
                </p>
              </article>
            </Reveal>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="#projects" className={primaryBtn}>
            View my projects
          </Link>
          <Link href="/resume" className={secondaryBtn}>
            My resume
          </Link>
          <OpenAskButton className={secondaryBtn} />
        </div>
      </div>
    </section>
  );
}
