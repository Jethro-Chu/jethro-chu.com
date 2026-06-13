import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/projects";

const map: Record<ProjectStatus, { dot: string; text: string }> = {
  Live: { dot: "bg-aqua", text: "text-aqua" },
  Beta: { dot: "bg-iris-soft", text: "text-iris-soft" },
  "In progress": { dot: "bg-gold", text: "text-gold" },
  Concept: { dot: "bg-coral", text: "text-coral" },
  Research: { dot: "bg-bone-dim", text: "text-bone-dim" },
};

export function StatusPill({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const c = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-ink/40 px-2.5 py-1 text-[11px]",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      <span className={cn("font-medium", c.text)}>{status}</span>
    </span>
  );
}
