import { site, sections } from "@/content/content";

const trailhead = sections[0];

/**
 * Hero — the valley floor (4,000 ft). The thesis of the site: identity plus an
 * invitation to start the climb. Bright midday light at the top fades to the
 * warm sand base. (Phase 2 replaces this static wash with the scroll-linked sweep.)
 */
export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-name"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-6 pb-24 pt-28 sm:px-10 lg:pb-28 lg:pl-16 lg:pr-40"
    >
      <p className="label-mono tnum flex items-center gap-2">
        <span className="text-[var(--color-shadow)]">
          {trailhead.elevation.toLocaleString("en-US")} ft
        </span>
        <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
        <span>{trailhead.landmark}, the valley floor</span>
      </p>

      <div className="mx-auto w-full max-w-4xl text-center">
        <h1 id="hero-name" className="text-summit legible-on-scene text-[var(--color-shadow)]">
          {site.name}
        </h1>
        <p className="legible-on-scene mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-[var(--color-muted)] sm:text-xl">
          {site.tagline}
        </p>
      </div>

      <a
        href="#approach"
        className="group mx-auto flex flex-col items-center gap-2 rounded-sm py-2"
      >
        <span className="label-mono group-hover:text-[var(--color-pine)] group-focus-visible:text-[var(--color-pine)]">
          Begin the climb
        </span>
        <span
          aria-hidden
          className="scroll-cue flex size-9 items-center justify-center rounded-full border border-[var(--color-granite-line)] text-[var(--color-pine)] transition-colors group-hover:border-[var(--color-pine)]"
        >
          <svg
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
        </span>
      </a>
    </section>
  );
}
