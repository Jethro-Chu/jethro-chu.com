import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getProject, projects, ACCENT_HEX } from "@/lib/projects";
import { ProjectVisual } from "@/components/visual/ProjectVisual";
import { StatusPill } from "@/components/ui/StatusPill";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { BackBar } from "@/components/work/BackBar";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — ${project.category}`,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary },
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const accent = ACCENT_HEX[project.accent];
  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article className="relative pb-10">
      {/* ambient accent glow keyed to project */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background: `radial-gradient(80% 60% at 50% 0%, ${accent}22, transparent 70%)`,
        }}
      />

      <BackBar />

      {/* hero */}
      <header className="mx-auto max-w-5xl px-5 pt-10 sm:px-8">
        <Reveal y={16}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-bone-faint">
              {project.index}
            </span>
            <StatusPill status={project.status} />
            <span className="font-mono text-xs text-bone-faint">
              {project.category} · {project.year}
            </span>
          </div>
        </Reveal>

        <Reveal y={24} delay={0.05}>
          <h1 className="mt-6 font-display text-hero leading-[0.92] tracking-tight">
            {project.title}
          </h1>
        </Reveal>

        <Reveal y={20} delay={0.1}>
          <p className="mt-6 max-w-2xl text-pretty text-xl leading-relaxed text-bone-dim">
            {project.summary}
          </p>
        </Reveal>

        <Reveal y={18} delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {project.links?.map((l) => (
              <Button key={l.label} href={l.href} external arrow magnetic>
                {l.label}
              </Button>
            ))}
            <span className="text-sm text-bone-faint">{project.role}</span>
          </div>
        </Reveal>
      </header>

      {/* hero visual */}
      <Reveal y={32} delay={0.1} className="mx-auto mt-14 max-w-6xl px-5 sm:px-8">
        <div className="glass edge-light relative aspect-[16/9] overflow-hidden rounded-3xl">
          <ProjectVisual project={project} />
        </div>
      </Reveal>

      {/* meta strip */}
      <div className="mx-auto mt-12 max-w-5xl px-5 sm:px-8">
        <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line/60 sm:grid-cols-4">
          {project.metrics.map((m) => (
            <RevealItem
              key={m.label}
              className="bg-surface/30 p-5 sm:p-6"
            >
              <p
                className="font-display text-2xl tracking-tight sm:text-3xl"
                style={{ color: accent }}
              >
                {m.value}
              </p>
              <p className="mt-1 text-xs text-bone-dim">{m.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {/* stack */}
      <div className="mx-auto mt-10 max-w-5xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-xs uppercase tracking-wider text-bone-faint">
              Stack
            </span>
            {project.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </Reveal>
      </div>

      {/* case-study body */}
      <div className="mx-auto mt-16 max-w-3xl px-5 sm:px-8">
        <div className="flex flex-col gap-14">
          {project.caseStudy.map((block, i) => (
            <Reveal key={i} y={24}>
              <section>
                {block.kicker && (
                  <div className="mb-4 inline-flex items-center gap-2.5">
                    <span
                      className="h-px w-8"
                      style={{
                        background: `linear-gradient(90deg, ${accent}, transparent)`,
                      }}
                    />
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
                      {block.kicker}
                    </span>
                  </div>
                )}
                {block.heading && (
                  <h2 className="mb-5 text-balance font-display text-section">
                    {block.heading}
                  </h2>
                )}
                <div className="flex flex-col gap-5">
                  {block.body.map((para, pi) => (
                    <p
                      key={pi}
                      className={
                        block.kind === "lead"
                          ? "text-pretty text-xl leading-relaxed text-bone"
                          : "text-pretty text-lg leading-relaxed text-bone-dim"
                      }
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </div>

      {/* next project */}
      <div className="mx-auto mt-24 max-w-5xl px-5 sm:px-8">
        <Reveal>
          <Link
            href={`/work/${next.slug}`}
            className="group glass edge-light focus-ring relative flex items-center justify-between gap-6 overflow-hidden rounded-3xl p-8 sm:p-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(60% 100% at 100% 50%, ${ACCENT_HEX[next.accent]}1f, transparent 70%)`,
              }}
            />
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
                Next project
              </p>
              <p className="mt-3 font-display text-3xl tracking-tight sm:text-5xl">
                {next.title}
              </p>
              <p className="mt-2 max-w-md text-sm text-bone-dim">
                {next.tagline}
              </p>
            </div>
            <span className="relative grid size-14 shrink-0 place-items-center rounded-full border border-line transition-colors group-hover:border-transparent group-hover:bg-bone">
              <ArrowUpRight
                className="size-6 text-bone-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                strokeWidth={2}
              />
            </span>
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
