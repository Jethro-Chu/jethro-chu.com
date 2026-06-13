"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  archiveProjects,
  allCategories,
  type Project,
  type ProjectCategory,
} from "@/lib/projects";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProjectVisual } from "@/components/visual/ProjectVisual";
import { cn } from "@/lib/utils";

type Filter = "All" | ProjectCategory;

export function Archive() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("All");
  const [hovered, setHovered] = useState<Project | null>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 350, damping: 30 });
  const sy = useSpring(py, { stiffness: 350, damping: 30 });

  const filters: Filter[] = ["All", ...allCategories];
  const shown = archiveProjects.filter(
    (p) => filter === "All" || p.category === filter
  );

  function onMove(e: React.MouseEvent) {
    px.set(e.clientX + 24);
    py.set(e.clientY - 80);
  }

  return (
    <section
      id="archive"
      onMouseMove={onMove}
      className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="02 — Full archive"
          title={
            <>
              Everything in{" "}
              <span className="font-display italic text-gradient">one place</span>.
            </>
          }
          description="Filter by discipline. Hover any row for a preview, click through for the full story."
        />

        {/* filters */}
        <div className="mt-10 flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "focus-ring relative rounded-full border px-4 py-2 text-sm transition-colors duration-300",
                  active
                    ? "border-transparent text-ink"
                    : "border-line text-bone-dim hover:border-bone-faint hover:text-bone"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-bone"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {f}
                <span
                  className={cn(
                    "ml-1.5 font-mono text-[11px]",
                    active ? "text-ink/50" : "text-bone-faint"
                  )}
                >
                  {f === "All"
                    ? archiveProjects.length
                    : archiveProjects.filter((p) => p.category === f).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* list */}
        <div className="mt-8 border-t border-line/60">
          <AnimatePresence mode="popLayout">
            {shown.map((project) => (
              <motion.div
                key={project.slug}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/work/${project.slug}`}
                  onMouseEnter={() => setHovered(project)}
                  onMouseLeave={() => setHovered((h) => (h === project ? null : h))}
                  className="group focus-ring relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-line/60 py-6 transition-colors sm:grid-cols-[3rem_1.4fr_1fr_auto_auto] sm:gap-6"
                >
                  {/* hover wash */}
                  <span className="pointer-events-none absolute inset-0 -z-10 origin-left scale-x-0 bg-gradient-to-r from-surface/60 to-transparent opacity-0 transition-all duration-500 ease-out group-hover:scale-x-100 group-hover:opacity-100" />

                  <span className="font-mono text-xs text-bone-faint transition-colors group-hover:text-bone-dim sm:pl-2">
                    {project.index}
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate font-display text-xl tracking-tight transition-transform duration-300 ease-out group-hover:translate-x-1 sm:text-2xl">
                      {project.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-bone-dim sm:hidden">
                      {project.category} · {project.year}
                    </p>
                  </div>

                  <p className="hidden truncate text-sm text-bone-dim sm:block">
                    {project.tagline}
                  </p>

                  <span className="hidden sm:block">
                    <StatusPill status={project.status} />
                  </span>

                  <span className="hidden font-mono text-xs text-bone-faint sm:block sm:w-24 sm:text-right">
                    {project.category}
                  </span>

                  <ArrowUpRight className="size-5 justify-self-end text-bone-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-bone sm:hidden" />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* floating cursor preview (desktop) */}
      {!reduce && (
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="pointer-events-none fixed left-0 top-0 z-40 hidden lg:block"
              style={{ x: sx, y: sy }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="glass-strong edge-light h-44 w-72 overflow-hidden rounded-2xl shadow-2xl">
                <ProjectVisual project={hovered} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
}
