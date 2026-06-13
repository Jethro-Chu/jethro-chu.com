import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { projects, moreWork, type Project } from "@/lib/projects";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";
import { LiveWindow } from "@/components/visual/LiveWindow";
import { ScreenshotPanel } from "@/components/visual/ScreenshotPanel";
import { Reveal } from "@/components/motion/Reveal";

export function Work() {
  return (
    <section id="work" className="scroll-mt-24 px-6 py-20 sm:px-8 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          eyebrow="Selected work"
          title="A few things I've designed and shipped."
          description="Curated, not exhaustive — each one is real, and most came out of the gap between using clinical software and building it."
        />

        <div className="mt-16 flex flex-col">
          {projects.map((project) => (
            <WorkEntry key={project.slug} project={project} />
          ))}
        </div>

        {/* quiet index of additional work (only when there's verified work to list) */}
        {moreWork.length > 0 && (
        <Reveal>
          <div className="mt-20 border-t border-line pt-6">
            <p className="eyebrow mb-2">Also building</p>
            <ul className="divide-y divide-line">
              {moreWork.map((m) => (
                <li
                  key={m.title}
                  className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
                >
                  <span className="font-display text-base font-medium">
                    {m.title}
                  </span>
                  <span className="text-sm text-muted">{m.outcome}</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted sm:col-start-1">
                    {m.meta}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        )}
      </div>
    </section>
  );
}

const SPEC_KEYS = ["Role", "Year", "Stack"] as const;

function WorkEntry({ project }: { project: Project }) {
  const spec: Record<(typeof SPEC_KEYS)[number], string> = {
    Role: project.role,
    Year: project.year,
    Stack: project.stack.join(" / "),
  };
  const isGame = project.live?.experience === "emotion";

  return (
    <Reveal as="article">
      <div className="border-t border-line py-10 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* live preview / playable poster */}
          <div className="lg:col-span-7">
            {isGame ? (
              <Link
                href={`/work/${project.slug}`}
                className="focus-ring group/poster block border border-line bg-surface"
              >
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    <span aria-hidden className="size-2 rounded-full bg-accent" />
                    <span className="text-ink">{project.title}</span>
                    <span aria-hidden>·</span> Playable
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    Full screen
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ScreenshotPanel project={project} className="h-full" />
                  <div className="absolute inset-0 grid place-items-center bg-bg/45">
                    <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-colors group-hover/poster:bg-[#22302b]">
                      <Play className="size-4" strokeWidth={1.75} />
                      Launch terminal
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <LiveWindow project={project} aspect="16 / 10" />
            )}
          </div>

          {/* text — read as a chart row */}
          <div className="group lg:col-span-5">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">{project.index}</span>
              <StatusPill status={project.status} />
            </div>

            <h3 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              <Link
                href={`/work/${project.slug}`}
                className="focus-ring transition-colors hover:text-accent-ink"
              >
                {project.title}
              </Link>
            </h3>
            <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted">
              {project.outcome}
            </p>

            {/* aligned label/value spec — flowsheet grammar */}
            <dl className="mt-6 divide-y divide-line border-t border-line">
              {SPEC_KEYS.map((k) => (
                <div key={k} className="grid grid-cols-[4.5rem_1fr] gap-3 py-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                    {k}
                  </dt>
                  <dd className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                    {spec[k]}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/work/${project.slug}`}
              className="focus-ring mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink"
            >
              {isGame ? "Launch terminal" : "View case study"}
              <ArrowRight
                className="size-4 text-accent transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
