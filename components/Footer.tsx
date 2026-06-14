import { contact, sections, site } from "@/content/content";

const view = sections[4];

/**
 * Contact / footer — the view from the top (8,839 ft). Keeps the warm summit
 * palette. A short line, the links, and a quiet close, plus a way to descend
 * back to the valley.
 */
export function Footer() {
  return (
    <footer
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-6 px-6 pb-28 pt-24 sm:px-10 sm:pb-24 sm:pt-28 lg:pb-16 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="label-mono tnum flex items-center gap-2">
          <span className="text-[var(--color-golden-deep)]">
            {view.elevation.toLocaleString("en-US")} ft
          </span>
          <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
          <span>{view.landmark}, the view</span>
        </p>

        <h2
          id="contact-heading"
          className="text-ridge mt-5 text-[var(--color-shadow)]"
        >
          {contact.heading}
        </h2>

        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-shadow)]">
          {contact.line}
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          {contact.links.map((l) =>
            l.href === "#" ? (
              <li key={l.label}>
                <span className="font-body text-base text-[var(--color-muted)]">
                  {l.label} <span className="label-mono">· soon</span>
                </span>
              </li>
            ) : (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                  className="font-body text-base font-medium text-[var(--color-pine)] underline decoration-[var(--color-pine)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-pine-deep)]"
                >
                  {l.label}
                  {l.href.startsWith("http") && (
                    <span className="sr-only"> (opens in a new tab)</span>
                  )}
                </a>
              </li>
            )
          )}
        </ul>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-granite-line)] pt-6">
          <p className="label-mono">
            © {new Date().getFullYear()} {site.name}
          </p>
          <a
            href="#hero"
            className="group inline-flex items-center gap-2 rounded-sm py-1 font-body text-sm font-medium text-[var(--color-pine)] transition-colors hover:text-[var(--color-pine-deep)]"
          >
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-full border border-[var(--color-granite-line)] transition-colors group-hover:border-[var(--color-pine)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
            Descend to the valley
          </a>
        </div>
      </div>
    </footer>
  );
}
