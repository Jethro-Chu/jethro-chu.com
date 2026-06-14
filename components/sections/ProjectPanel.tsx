import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import { projectThemeStyle } from "@/lib/theme";
import { ProjectPoster } from "@/components/visual/posters/ProjectPoster";
import { ProjectGlyph } from "@/components/visual/posters/ProjectGlyph";
import { LiveGlyph } from "@/components/visual/LiveGlyph";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const SPEC = ["Role", "Year", "Stack"] as const;

export function ProjectPanel({
  project,
  index,
  total,
}: {
  project: Project;
  index: number;
  total: number;
}) {
  const t = project.theme;
  const dark = !!t.dark;
  const isGame = project.live?.experience === "emotion";

  const liveHref = isGame
    ? `/work/${project.slug}`
    : project.links?.find((l) => /open|live|launch/i.test(l.label))?.href;
  const liveLabel = isGame ? "Launch terminal" : project.live?.openLabel ?? "Open live";
  const external = !!liveHref && /^https?:/.test(liveHref);

  const watch = project.status === "Beta" || project.status === "In progress";
  // status label color: amber-as-text needs the safe sibling on light, the amber itself on dark
  const statusColor = watch
    ? dark
      ? "var(--color-amber)"
      : "var(--color-amber-ink)"
    : "var(--color-primary)";

  const spec: Record<(typeof SPEC)[number], string> = {
    Role: project.role,
    Year: project.year,
    Stack: project.stack.join(" / "),
  };

  return (
    <section
      aria-label={`${project.title}, project ${index + 1} of ${total}`}
      className="flex min-h-[100svh] items-center overflow-hidden py-10 lg:h-[100svh] lg:py-0"
      style={projectThemeStyle(t)}
    >
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-5 px-6 sm:gap-7 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:px-16">
        {/* media: clinical instrument frame */}
        <Reveal className="lg:col-span-7">
          <figure
            className="overflow-hidden rounded-[var(--radius-sm)] border shadow-[var(--shadow-card)]"
            style={{ borderColor: "var(--color-line)" }}
          >
            <figcaption
              className="flex items-center justify-between gap-3 border-b px-3 py-2"
              style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}
            >
              <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      project.status === "Live"
                        ? "var(--color-amber)"
                        : "var(--color-primary)",
                  }}
                />
                <span className="truncate" style={{ color: "var(--color-ink)" }}>
                  {project.title}
                </span>
                <span aria-hidden style={{ color: "var(--color-muted)" }}>
                  ·
                </span>
                <span style={{ color: "var(--color-muted)" }}>{project.theme.label}</span>
              </span>
              {liveHref && (
                <Link
                  href={liveHref}
                  {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="focus-ring group/open inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: "var(--color-muted)" }}
                >
                  Open
                  <ArrowUpRight
                    className="size-3 transition-transform duration-200 group-hover/open:-translate-y-0.5 group-hover/open:translate-x-0.5"
                    strokeWidth={1.75}
                  />
                </Link>
              )}
            </figcaption>
            <div className="aspect-[2/1] sm:aspect-[16/10]">
              <ProjectPoster project={project} />
            </div>
          </figure>
        </Reveal>

        {/* content */}
        <div className="lg:col-span-5">
          <RevealGroup className="flex flex-col">
            <RevealItem className="flex items-center gap-3">
              <ProjectGlyph
                slug={project.slug}
                className="h-9 w-9"
                // outline follows ink; accents follow the theme primary/amber
              />
              <span
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--color-muted)" }}
              >
                {project.index} / {project.category}
              </span>
              <span aria-hidden className="h-3 w-px" style={{ background: "var(--color-line)" }} />
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em]"
                style={{ color: statusColor }}
              >
                {project.status === "Live" && liveHref && <LiveGlyph size={13} />}
                {project.status}
              </span>
            </RevealItem>

            <RevealItem>
              <h3 className="mt-4 font-display text-3xl font-medium tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
                {project.title}
              </h3>
            </RevealItem>

            <RevealItem>
              <p
                className="mt-3 max-w-md text-pretty text-base leading-relaxed sm:mt-4 sm:text-lg"
                style={{ color: "var(--color-muted)" }}
              >
                {project.outcome}
              </p>
            </RevealItem>

            <RevealItem>
              <dl
                className="mt-4 max-w-md divide-y border-t sm:mt-6"
                style={{ borderColor: "var(--color-line)" }}
              >
                {SPEC.map((k) => (
                  <div
                    key={k}
                    className="grid grid-cols-[4.5rem_1fr] gap-3 py-1.5 sm:py-2"
                    style={{ borderColor: "var(--color-line)" }}
                  >
                    <dt
                      className="font-mono text-[11px] uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {k}
                    </dt>
                    <dd
                      className="font-mono text-[11px] uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {spec[k]}
                    </dd>
                  </div>
                ))}
              </dl>
            </RevealItem>

            {project.metrics.length > 0 && (
              <RevealItem>
                <ul className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  {project.metrics.map((m) => (
                    <li
                      key={m.label}
                      className="inline-flex items-baseline gap-1.5 border px-2 py-1 font-mono text-[11px]"
                      style={{ borderColor: "var(--color-line)" }}
                    >
                      <span className="tabular-nums" style={{ color: "var(--color-ink)" }}>
                        {m.value}
                      </span>
                      <span
                        className="uppercase tracking-[0.12em]"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {m.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </RevealItem>
            )}

            <RevealItem className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              {liveHref && (
                <Link
                  href={liveHref}
                  {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="focus-ring group/cta inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-medium"
                  style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
                >
                  {liveLabel}
                  {external ? (
                    <ArrowUpRight
                      className="size-4 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <ArrowRight
                      className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                      strokeWidth={1.75}
                    />
                  )}
                </Link>
              )}
              {!isGame && (
                <Link
                  href={`/work/${project.slug}`}
                  className="focus-ring group/case inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-5 py-2.5 text-sm font-medium"
                  style={{ borderColor: "var(--color-line-strong)", color: "var(--color-ink)" }}
                >
                  Case study
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover/case:translate-x-0.5"
                    strokeWidth={1.75}
                    style={{ color: "var(--color-primary)" }}
                  />
                </Link>
              )}
            </RevealItem>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
