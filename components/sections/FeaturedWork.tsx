import { featuredProjects } from "@/lib/projects";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { Reveal } from "@/components/motion/Reveal";

export function FeaturedWork() {
  return (
    <section id="work" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="01 — Selected work"
            title={
              <>
                A few things I&apos;m{" "}
                <span className="font-display italic text-gradient">proud</span> of.
              </>
            }
            description="Each one shipped or shipping — built end-to-end, from the first sketch to the deployed product."
          />
          <Reveal y={16} delay={0.1}>
            <p className="font-mono text-xs text-bone-faint sm:text-right">
              {featuredProjects.length} featured · scroll for the full archive
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {featuredProjects.map((project, i) => (
            <Reveal
              key={project.slug}
              y={36}
              delay={(i % 2) * 0.08}
              className={i === 0 ? "md:col-span-2" : ""}
            >
              <ProjectCard project={project} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
