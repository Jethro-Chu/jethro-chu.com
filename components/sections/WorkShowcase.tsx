import { projects } from "@/lib/projects";
import { ProjectPanel } from "@/components/sections/ProjectPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Selected work as an equal-weight, per-project themed showcase.
 *
 * Each project is a full-viewport, opaque, self-themed panel. They are
 * CSS `position: sticky` and stacked with rising z-index, so as you scroll
 * the next project slides up and covers the current one: the theme shifts
 * and the next project settles into place. This is scroll-native (no JS
 * scroll handlers), so it is smooth on touch and desktop alike, and every
 * text color always sits on its own theme background (AA-safe, including
 * the dark terminal). Content reveals are gated by prefers-reduced-motion;
 * the sticky stacking itself is plain scrolling, never an animation.
 */
export function WorkShowcase() {
  return (
    <section id="work" className="scroll-mt-16 bg-bg">
      <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-20 sm:px-8 sm:pt-28 lg:px-16">
        <SectionHeading
          eyebrow="Selected work"
          title="Five things I've designed and shipped."
          description="Each one is real, and each is its own world. Scroll to step into them, one at a time."
        />
      </div>

      <div className="relative">
        {projects.map((project, i) => (
          <div key={project.slug} className="lg:sticky lg:top-0" style={{ zIndex: i + 1 }}>
            <ProjectPanel project={project} index={i} total={projects.length} />
          </div>
        ))}
      </div>
    </section>
  );
}
