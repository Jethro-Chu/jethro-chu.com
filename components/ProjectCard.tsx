import type { Project } from "@/content/content";
import { AskAboutButton } from "@/components/ask-jethro/triggers";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/**
 * One project, styled like a trail-register entry: a mono index, a serif
 * title, a plain summary, the stack as quiet tags, and a clear link.
 * Legibility first. An unfilled slot renders as a clearly labelled placeholder.
 */
export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  if (project.placeholder) {
    return (
      <article className="rounded-md border border-dashed border-[var(--color-granite-line)] p-6 sm:p-7">
        <span className="label-mono tnum">{pad2(index)} · open slot</span>
        <p className="mt-3 max-w-xl text-pretty leading-relaxed text-[var(--color-muted)]">
          {project.summary}
        </p>
      </article>
    );
  }

  return (
    <article className="group grid gap-5 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-7 shadow-[0_1px_2px_rgba(60,64,73,0.05),0_10px_30px_-16px_rgba(60,64,73,0.16)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(60,64,73,0.06),0_18px_44px_-18px_rgba(60,64,73,0.24)] sm:p-8 lg:grid-cols-[14rem_1fr] lg:gap-10">
      {/* left: index, title, role */}
      <div>
        <span className="label-mono tnum text-[var(--color-pine)]">{pad2(index)}</span>
        <h3 className="text-rise mt-2 text-[var(--color-shadow)]">
          {project.title}
        </h3>
        {project.role && (
          <p className="mt-1.5 font-mono text-[0.72rem] text-[var(--color-muted)]">
            {project.role}
          </p>
        )}
      </div>

      {/* right: summary, stack, link */}
      <div className="lg:border-l lg:border-[var(--color-granite-line)] lg:pl-8">
        <p className="max-w-xl text-pretty leading-relaxed text-[var(--color-shadow)]">
          {project.summary}
        </p>

        {project.stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li
                key={s}
                className="rounded-xs border border-[var(--color-granite-line)] px-2 py-0.5 font-mono text-[0.7rem] text-[var(--color-pine)]"
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        {(project.link || project.repo) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {[project.link, project.repo].filter(Boolean).map((l) => (
              <a
                key={l!.href}
                href={l!.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-[var(--color-pine)] underline decoration-[var(--color-pine)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-pine-deep)]"
              >
                {l!.label}
                <span className="sr-only"> (opens in a new tab)</span>
                <svg
                  aria-hidden
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            ))}
          </div>
        )}

        <div className="mt-5">
          <AskAboutButton projectId={project.id} />
        </div>
      </div>
    </article>
  );
}
