import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getProject, projects } from "@/lib/projects";
import { LiveWindow } from "@/components/visual/LiveWindow";
import { StatusPill } from "@/components/ui/StatusPill";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { BackBar } from "@/components/work/BackBar";

export function generateStaticParams() {
  // emotion-stock-market has its own dedicated full-screen route
  return projects
    .filter((p) => p.slug !== "emotion-stock-market")
    .map((p) => ({ slug: p.slug }));
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

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article className="pb-10">
      <BackBar />

      {/* hero */}
      <header className="mx-auto max-w-5xl px-6 pt-10 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span>{project.index}</span>
            <StatusPill status={project.status} />
            <span>{project.category}</span>
            <span>{project.year}</span>
            <span className="ml-auto normal-case tracking-normal">{project.role}</span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-8 font-display text-hero font-medium tracking-tight">
            {project.title}
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">
            {project.summary}
          </p>
        </Reveal>

        {project.links && project.links.length > 0 && (
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {project.links.map((l) => (
                <Button key={l.label} href={l.href} external arrow>
                  {l.label}
                </Button>
              ))}
            </div>
          </Reveal>
        )}
      </header>

      {/* hero visual — live window + timestamped annotation (signature) */}
      <Reveal delay={0.1} className="mx-auto mt-12 max-w-6xl px-6 sm:px-8">
        <figure>
          <LiveWindow project={project} aspect="16 / 9" />
          <figcaption className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="text-accent">▸</span>
            Plate 01 · {project.title}
            {project.live?.embeddable
              ? " — live, interactive preview"
              : project.live
                ? " — hosted externally; opens in a new tab"
                : " interface — representative placeholder"}
          </figcaption>
        </figure>
      </Reveal>

      {/* metrics — flowsheet readout */}
      <div className="mx-auto mt-14 max-w-5xl px-6 sm:px-8">
        <RevealGroup className="grid grid-cols-2 border-t border-l border-line sm:grid-cols-4">
          {project.metrics.map((m) => (
            <RevealItem key={m.label} className="border-b border-r border-line p-5">
              <p className="font-mono text-2xl tabular-nums text-ink sm:text-3xl">
                {m.value}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {m.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {/* stack */}
      <div className="mx-auto mt-8 max-w-5xl px-6 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Stack
            </span>
            {project.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </Reveal>
      </div>

      {/* case-study body */}
      <div className="mx-auto mt-16 max-w-3xl px-6 sm:px-8">
        <div className="flex flex-col gap-14">
          {project.caseStudy.map((block, i) => (
            <Reveal key={i}>
              <section>
                {block.kicker && (
                  <p className="eyebrow mb-3 border-b border-line pb-2">
                    {block.kicker}
                  </p>
                )}
                {block.heading && (
                  <h2 className="mb-5 text-balance font-display text-section font-medium">
                    {block.heading}
                  </h2>
                )}
                <div className="flex flex-col gap-5">
                  {block.body.map((para, pi) => (
                    <p
                      key={pi}
                      className={
                        block.kind === "lead"
                          ? "text-pretty text-lg leading-relaxed text-ink sm:text-xl"
                          : "text-pretty leading-relaxed text-muted"
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
      <div className="mx-auto mt-24 max-w-5xl px-6 sm:px-8">
        <Reveal>
          <Link
            href={`/work/${next.slug}`}
            className="group block border-t border-line pt-6"
          >
            <p className="eyebrow">Next</p>
            <div className="mt-3 flex items-center justify-between gap-6">
              <div>
                <p className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                  {next.title}
                </p>
                <p className="mt-2 max-w-md text-sm text-muted">{next.outcome}</p>
              </div>
              <ArrowRight
                className="size-6 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.75}
              />
            </div>
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
