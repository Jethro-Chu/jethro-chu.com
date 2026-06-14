import { sections, ELEVATION_START, ELEVATION_SUMMIT } from "@/content/content";
import type { SectionMeta } from "@/content/content";
import { cn } from "@/lib/utils";

/**
 * The altimeter — the signature element.
 *
 * A faithful map of the real Half Dome climb: junctions sit at their true
 * elevations (4,000 ft trailhead to 8,839 ft summit), and the device doubles
 * as navigation and the escape hatch straight to Projects (non-negotiable #2).
 *
 * Phase 1: a static, fully keyboard-operable nav built from plain anchors, so
 * it works with no JS and is the reduced-motion fallback as-is. The scroll-linked
 * climbing marker and live readout arrive in Phase 2, layered on top of this.
 *
 * Desktop: a slim vertical rail fixed to the right gutter. The trailhead sits at
 * the top and the summit at the bottom, so the marker travels down with the
 * scroll (descending the page is ascending the mountain).
 * Mobile: a compact bottom bar of junction chips.
 */

const fmt = (n: number) => n.toLocaleString("en-US");
const range = ELEVATION_SUMMIT - ELEVATION_START;

/** vertical position on the rail: trailhead (top) -> summit (bottom). */
function railTop(elevation: number) {
  const frac = (elevation - ELEVATION_START) / range; // 0 at trailhead, 1 at summit
  return `calc(12vh + 76vh * ${frac})`;
}

/** group sections by distinct elevation (about + contact share the summit). */
function groupByElevation(items: SectionMeta[]) {
  const map = new Map<number, SectionMeta[]>();
  for (const s of items) {
    const g = map.get(s.elevation) ?? [];
    g.push(s);
    map.set(s.elevation, g);
  }
  return [...map.entries()]
    .map(([elevation, list]) => ({ elevation, list }))
    .sort((a, b) => a.elevation - b.elevation); // trailhead first (top of the rail)
}

export function Altimeter() {
  const groups = groupByElevation(sections);

  return (
    <>
      {/* ---- desktop: vertical rail, fixed in the right gutter ---- */}
      <nav
        aria-label="Elevation rail"
        className="pointer-events-none fixed right-0 top-0 z-40 hidden h-screen w-40 lg:block"
      >
        {/* the track */}
        <span
          aria-hidden
          className="absolute bottom-[12vh] right-[58px] top-[12vh] w-px bg-[var(--color-granite-line)]"
        />

        {groups.map(({ elevation, list }) => (
          <div
            key={elevation}
            className="pointer-events-auto absolute right-[52px] flex -translate-y-1/2 flex-col items-end gap-1.5"
            style={{ top: railTop(elevation) }}
          >
            {list.map((s) => {
              const isProjects = s.id === "projects"; // the escape hatch to the work
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group flex items-center gap-2.5"
                  aria-label={
                    isProjects
                      ? `Jump to projects, ${fmt(elevation)} feet`
                      : `${s.label}, ${fmt(elevation)} feet`
                  }
                >
                  <span className="flex flex-col items-end leading-tight">
                    <span
                      className={cn(
                        "font-body text-[0.82rem] transition-colors group-hover:text-[var(--color-pine)] group-focus-visible:text-[var(--color-pine)]",
                        isProjects
                          ? "font-semibold text-[var(--color-pine)]"
                          : "font-medium text-[var(--color-shadow)]"
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="label-mono tnum text-[0.66rem]">
                      {fmt(elevation)} ft
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-3 shrink-0 rounded-full border-2 transition-colors",
                      isProjects
                        ? "border-[var(--color-pine)] bg-[var(--color-pine)]"
                        : "border-[var(--color-granite-line)] bg-[var(--color-sand)] group-hover:border-[var(--color-pine)] group-hover:bg-[var(--color-pine)] group-focus-visible:border-[var(--color-pine)]"
                    )}
                  />
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ---- mobile / tablet: bottom junction bar ---- */}
      <nav
        aria-label="Elevation bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-sand)_92%,transparent)] backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="no-scrollbar flex items-stretch gap-1 overflow-x-auto px-2 py-1.5">
          {sections.map((s) => {
            const isProjects = s.id === "projects";
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-label={isProjects ? "Jump to projects" : undefined}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center rounded-sm px-3 py-1",
                    isProjects && "bg-[color-mix(in_oklab,var(--color-pine)_12%,transparent)]"
                  )}
                >
                  <span
                    className={cn(
                      "font-body text-[0.78rem]",
                      isProjects
                        ? "font-semibold text-[var(--color-pine)]"
                        : "font-medium text-[var(--color-shadow)]"
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="label-mono tnum text-[0.6rem]">
                    {fmt(s.elevation)} ft
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
