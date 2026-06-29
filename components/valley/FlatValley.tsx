/* ============================================================
   FlatValley  ·  the real, indexable, no-JS content path.
   Server-rendered from content/portfolio.ts. At integration this is
   replaced by the existing shipped site as the fallback; for the
   prototype it gives /valley readable content. Existing tokens only.
   ============================================================ */

import { landmarks, projectsForLandmark, status } from "@/content/portfolio";

export function FlatValley() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-28 pt-16 sm:pt-24">
      <header className="mb-14">
        <span className="eyebrow">Yosemite Valley</span>
        <h1 className="text-summit mt-3 text-[var(--color-shadow)]">The valley</h1>
        <p className="mt-4 max-w-prose text-[1.05rem] leading-relaxed text-[var(--color-muted)]">
          An explorable pixel Yosemite Valley that doubles as the portfolio. Every
          landmark opens a real part of the work. This is the readable version: the
          same content, no game required.
        </p>
        <p className="label-mono tnum mt-3 text-[0.72rem]">
          {status.degree} · {status.school} · expected {status.bsnGraduation} ·{" "}
          {status.clinicalHours} clinical hours
        </p>
      </header>

      <div className="space-y-14">
        {landmarks.map((l) => {
          const projects = projectsForLandmark(l);
          return (
            <section key={l.id} id={l.id} aria-labelledby={`${l.id}-h`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-granite-line)] pb-2">
                <span className="eyebrow">{l.section}</span>
                <span className="label-mono text-[0.72rem]">{l.landmark}</span>
              </div>
              <h2 id={`${l.id}-h`} className="text-ridge mt-3 text-[var(--color-shadow)]">
                {l.title}
              </h2>

              {l.authoredLine && (
                <p className="mt-3 rounded-sm border border-dashed border-[var(--color-golden)] bg-[color-mix(in_oklab,var(--color-golden)_8%,transparent)] p-3 text-[0.85rem] italic text-[var(--color-muted)]">
                  <span className="label-mono not-italic">Draft · Jethro to author —</span>{" "}
                  {l.authoredLine.replace(/^JETHRO:\s*/, "")}
                </p>
              )}

              <div className="mt-3 space-y-3">
                {l.body.map((para, i) => (
                  <p key={i} className="max-w-prose leading-relaxed text-[var(--color-shadow)]">
                    {para}
                  </p>
                ))}
              </div>

              {projects.length > 0 && (
                <ul className="mt-5 space-y-4">
                  {projects.map((proj) => (
                    <li key={proj.id} className="border-l-2 border-[var(--color-pine)] pl-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-[1.1rem] font-medium text-[var(--color-shadow)]">
                          {proj.title}
                        </span>
                        {proj.link && (
                          <a
                            href={proj.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="label-mono text-[0.7rem] text-[var(--color-pine)] underline underline-offset-2"
                          >
                            {proj.link.label}
                          </a>
                        )}
                      </div>
                      <p className="mt-1 max-w-prose text-[0.9rem] leading-snug text-[var(--color-muted)]">
                        {proj.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {l.links && l.links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {l.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="fast-ui rounded-sm border border-[var(--color-pine)] px-3 py-1.5 text-[0.82rem] font-medium text-[var(--color-pine)] hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)]"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
