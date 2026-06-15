import { projects, sections } from "@/content/content";
import { ProjectCard } from "@/components/ProjectCard";

const subdome = sections[2];

/**
 * Projects — the sub-dome (8,200 ft). The heart of the site, and the part that
 * stays ruthlessly scannable. Cards read top to bottom in a simple, fast layout.
 */
export function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="projects-heading"
            className="text-ridge text-[var(--color-shadow)]"
          >
            Projects
          </h2>
          <p className="label-mono tnum flex items-center gap-2">
            <span className="text-[var(--color-pine)]">
              {subdome.elevation.toLocaleString("en-US")} ft
            </span>
            <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
            <span>{subdome.landmark}</span>
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-16 sm:mt-16 sm:gap-24">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
