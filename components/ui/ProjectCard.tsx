"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ACCENT_HEX, type Project } from "@/lib/projects";
import { ProjectVisual } from "@/components/visual/ProjectVisual";
import { StatusPill } from "@/components/ui/StatusPill";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";

/**
 * Large featured card. Cursor-tracked spotlight + gentle 3D tilt.
 * Whole card is a link to the case study.
 */
export function ProjectCard({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const accent = ACCENT_HEX[project.accent];

  // spotlight position
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  // tilt
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 100);
    my.set(py * 100);
    if (!reduce) {
      rx.set((0.5 - py) * 6);
      ry.set((px - 0.5) * 8);
    }
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
    mx.set(50);
    my.set(50);
  }

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, ${accent}22, transparent 60%)`;

  return (
    <motion.div style={{ perspective: 1200 }} className={className}>
      <motion.a
        ref={ref}
        href={`/work/${project.slug}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group glass edge-light focus-ring relative block h-full overflow-hidden rounded-3xl"
      >
        {/* spotlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight }}
        />

        {/* preview */}
        <div className="relative aspect-[16/10] overflow-hidden border-b border-line/60">
          <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
            <ProjectVisual project={project} />
          </div>
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <StatusPill status={project.status} />
          </div>
          <div className="absolute right-4 top-4 z-10">
            <span className="font-mono text-xs text-bone-faint">
              {project.year}
            </span>
          </div>
        </div>

        {/* body */}
        <div className="relative z-10 flex flex-col gap-4 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-bone-faint">
                {project.index}
              </span>
              <h3 className="font-display text-2xl tracking-tight sm:text-3xl">
                {project.title}
              </h3>
            </div>
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line transition-all duration-300 group-hover:border-transparent"
              style={{ background: "transparent" }}
            >
              <ArrowUpRight
                className="size-4 text-bone-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-bone"
                strokeWidth={2}
              />
            </span>
          </div>

          <p className="max-w-md text-pretty text-[15px] leading-relaxed text-bone-dim">
            {project.tagline}
          </p>

          <div className="mt-1 flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        {/* accent baseline that grows on hover */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
      </motion.a>
    </motion.div>
  );
}
