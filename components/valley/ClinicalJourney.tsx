import type {
  ClinicalJourneyContent,
  LandmarkLink,
} from "@/content/portfolio";

interface ClinicalJourneyProps {
  content: ClinicalJourneyContent;
  links: LandmarkLink[];
  idPrefix: string;
  variant?: "room" | "flat";
}

export function ClinicalJourney({
  content,
  links,
  idPrefix,
  variant = "room",
}: ClinicalJourneyProps) {
  const elevated = variant === "room";
  const surfaceClass = elevated
    ? "border-[color-mix(in_oklab,var(--color-granite-line)_60%,transparent)] bg-[var(--color-card)] shadow-md"
    : "border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-card)_72%,transparent)]";

  return (
    <div className="mt-6 space-y-8">
      <section
        aria-labelledby={`${idPrefix}-overview`}
        className={`rounded-md border p-5 sm:p-6 ${surfaceClass}`}
      >
        <h3
          id={`${idPrefix}-overview`}
          className="label-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--color-pine)]!"
        >
          Training overview
        </h3>
        <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-[var(--color-shadow)] sm:text-base">
          {content.intro}
        </p>

        <dl className="mt-6 grid overflow-hidden rounded-sm border border-[var(--color-granite-line)] sm:grid-cols-2">
          {content.stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`min-w-0 bg-[color-mix(in_oklab,var(--color-card)_70%,var(--color-sand))] px-4 py-4 ${
                index > 0 ? "border-t border-[var(--color-granite-line)]" : ""
              } ${
                index === 1 ? "sm:border-t-0 sm:border-l" : ""
              } ${
                index === 2 ? "sm:border-t" : ""
              } ${
                index === 3 ? "sm:border-l" : ""
              }`}
            >
              <dt className="label-mono text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                {stat.label}
              </dt>
              <dd className="label-mono tnum mt-1.5 text-[0.74rem] leading-relaxed text-[var(--color-shadow)]! sm:text-[0.78rem]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby={`${idPrefix}-sites`}>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--color-granite-line)] pb-2">
          <h3
            id={`${idPrefix}-sites`}
            className="font-display text-[1.25rem] font-medium text-[var(--color-shadow)]"
          >
            Clinical sites and experience
          </h3>
          <span className="label-mono tnum shrink-0 text-[0.64rem]">
            {content.sites.length} sites
          </span>
        </div>

        <ol className="relative mt-5 space-y-3 before:absolute before:bottom-5 before:left-[0.94rem] before:top-5 before:w-px before:bg-[var(--color-pine)] sm:before:left-[1.19rem]">
          {content.sites.map((site, index) => (
            <li key={site.organization} className="relative pl-10 sm:pl-12">
              <span
                aria-hidden="true"
                className="label-mono tnum absolute left-0 top-4 z-10 flex size-[1.9rem] items-center justify-center rounded-full border border-[var(--color-pine)] bg-[var(--color-card)] text-[0.58rem] font-semibold text-[var(--color-pine)]! sm:size-10 sm:text-[0.64rem]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className={`rounded-md border px-4 py-4 sm:px-5 ${surfaceClass}`}>
                <h4 className="font-display text-[1.02rem] font-medium leading-snug text-[var(--color-shadow)]">
                  {site.organization}
                </h4>
                <p className="mt-1 text-[0.86rem] leading-relaxed text-[var(--color-muted)] sm:text-[0.9rem]">
                  {site.experience}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby={`${idPrefix}-interests`}
        className="rounded-md border-l-4 border-[var(--color-pine)] bg-[var(--color-pine-deep)] px-5 py-5 text-[var(--color-on-dark)] shadow-md sm:px-6 sm:py-6"
      >
        <h3
          id={`${idPrefix}-interests`}
          className="label-mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--color-on-dark-muted)]!"
        >
          Nursing interests
        </h3>
        <p className="mt-3 font-display text-[1.08rem] leading-relaxed text-[var(--color-on-dark)] sm:text-[1.2rem]">
          {content.interest}
        </p>
      </section>

      <nav
        aria-label="Clinical journey actions"
        className="flex flex-col gap-3 sm:flex-row"
      >
        {links.map((link, index) => (
          <a
            key={link.href}
            href={link.href}
            className={`fast-ui inline-flex min-h-11 items-center justify-center rounded-sm border px-5 py-2.5 text-center text-[0.86rem] font-semibold focus-visible:outline-[var(--color-shadow)] ${
              index === 0
                ? "border-[var(--color-pine)] bg-[var(--color-pine)] text-[var(--color-on-dark)] hover:border-[var(--color-pine-deep)] hover:bg-[var(--color-pine-deep)] hover:text-[var(--color-on-dark)] active:bg-[var(--color-shadow)] active:text-[var(--color-card)]"
                : "border-[var(--color-pine-deep)] bg-[var(--color-card)] text-[var(--color-pine-deep)] hover:bg-[var(--color-pine-deep)] hover:text-[var(--color-on-dark)] active:border-[var(--color-shadow)] active:bg-[var(--color-shadow)] active:text-[var(--color-card)]"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
