import type { Project } from "@/lib/projects";
import { ProjectGlyph } from "@/components/visual/posters/ProjectGlyph";
import { TerminalPoster } from "@/components/visual/posters/TerminalPoster";
import { VitalsWaveform } from "@/components/visual/VitalsWaveform";
import { cn } from "@/lib/utils";

/**
 * The project's hero visual, in priority order:
 *   1. Emotion Stock Market: the faithful inline-SVG terminal poster.
 *   2. A real screenshot at project.shot (when one exists).
 *   3. An honest illustrated poster: the project's themed glyph over a
 *      quiet vitals well. This is clearly an illustration, never a fake
 *      product screenshot.
 * Colors come from the project theme tokens scoped on the section.
 */
export function ProjectPoster({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  if (project.slug === "emotion-stock-market") {
    return <TerminalPoster className={className} />;
  }

  if (project.shot) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.shot}
        alt={`${project.title} screenshot`}
        loading="lazy"
        className={cn("h-full w-full object-cover object-top", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden",
        className
      )}
      style={{ background: "var(--color-surface-sunk)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-50">
        <VitalsWaveform draw={false} rPeak={false} strokeWidth={1.5} height={120} />
      </div>
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <ProjectGlyph
          slug={project.slug}
          className="h-14 w-14"
          // glyph outline = ink; accents pull the theme primary/amber
        />
        <span
          className="font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ color: "var(--color-muted)" }}
        >
          {project.title}
        </span>
      </div>
    </div>
  );
}
