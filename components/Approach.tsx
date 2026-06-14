import { approach, sections } from "@/content/content";

const falls = sections[1];

/**
 * The approach — the falls (5,900 ft). A brief band as the climb steepens.
 * Pine greens come forward. Short by design: this is the trees, not the summit.
 */
export function Approach() {
  return (
    <section
      id="approach"
      aria-labelledby="approach-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-32"
    >
      <div className="mx-auto max-w-3xl">
        <p className="label-mono tnum flex items-center gap-2">
          <span className="text-[var(--color-pine)]">
            {falls.elevation.toLocaleString("en-US")} ft
          </span>
          <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
          <span>{falls.landmark}</span>
        </p>

        <h2
          id="approach-heading"
          className="text-ridge mt-5 text-[var(--color-shadow)]"
        >
          {approach.heading}
        </h2>

        <div className="mt-6 space-y-4 text-lg leading-relaxed text-[var(--color-shadow)] sm:text-xl">
          {approach.body.map((para, i) => (
            <p key={i} className="max-w-2xl text-pretty">
              {para}
            </p>
          ))}
        </div>

        <a
          href="#projects"
          className="mt-8 inline-flex items-center gap-2 font-body text-base font-medium text-[var(--color-pine)] underline decoration-[var(--color-golden)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-pine-deep)]"
        >
          Skip ahead to the projects
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
