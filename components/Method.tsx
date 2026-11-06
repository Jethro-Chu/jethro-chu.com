import Link from "next/link";
import { method } from "@/content/profile";
import { Reveal } from "@/components/motion/Reveal";
import { OpenAskButton } from "@/components/ask-jethro/triggers";
import { DecodeText } from "@/components/motion/DecodeText";

/**
 * Method — how Jethro builds. A personal, authentic reflection on curiosity,
 * clinical insights, and building software. An editorial two-column layout with
 * genuine voice, thoughtful typography, and intentional whitespace.
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
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20 items-start">
          {/* Left Column: Eyebrow, main headline, and desktop actions */}
          <div className="lg:col-span-5">
            <DecodeText as="p" className="eyebrow" text="Method" />
            <h2
              id="method-heading"
              className="text-ridge mt-4 max-w-md text-pretty text-[var(--color-shadow)]"
            >
              {method.title}
            </h2>

            {/* Desktop button alignment */}
            <div className="mt-8 hidden lg:flex flex-wrap items-center gap-3">
              <Link href="/resume" className={primaryBtn}>
                My resume
              </Link>
              <OpenAskButton className={secondaryBtn} />
            </div>
          </div>

          {/* Right Column: Natural editorial story & personal takeaway */}
          <Reveal className="lg:col-span-7 space-y-5" delay={0.08}>
            <p className="text-lg leading-relaxed text-[var(--color-shadow)] sm:text-xl font-normal text-pretty">
              {method.paragraphs[0]}
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-[var(--color-shadow)]/90 text-pretty">
              {method.paragraphs[1]}
            </p>

            <p className="text-base sm:text-lg leading-relaxed text-[var(--color-shadow)]/90 text-pretty">
              {method.paragraphs[2]}
            </p>

            {/* Subtle personal takeaway */}
            <div className="border-l-2 border-[var(--color-pine)] pl-4 sm:pl-5 py-0.5 mt-6">
              <p className="font-display italic text-base sm:text-lg text-[var(--color-shadow)] text-pretty">
                {method.paragraphs[3]}
              </p>
            </div>

            {/* Mobile button alignment */}
            <div className="pt-4 flex flex-wrap items-center gap-3 lg:hidden">
              <Link href="/resume" className={primaryBtn}>
                My resume
              </Link>
              <OpenAskButton className={secondaryBtn} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
