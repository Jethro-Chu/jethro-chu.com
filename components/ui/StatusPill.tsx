import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/projects";

/**
 * Quiet status indicator — a small square mark + mono label.
 * No pill, no glow. "Live" gets the accent fill; others stay neutral.
 */
const filled: Record<ProjectStatus, boolean> = {
  Live: true,
  Beta: false,
  "In progress": false,
  Research: false,
};

export function StatusPill({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const on = filled[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2",
          on ? "bg-accent" : "border border-muted"
        )}
      />
      {status}
    </span>
  );
}
