import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/projects";
import { LiveGlyph } from "@/components/visual/LiveGlyph";

/**
 * Quiet status indicator. "Live" gets the amber pulse glyph; "Beta" /
 * "In progress" are the honest "watch" states, marked in amber-ink (the
 * AA-safe amber for text). Others stay neutral mono. No glowing pill.
 */
const watchSet: Record<ProjectStatus, boolean> = {
  Live: false,
  Beta: true,
  "In progress": true,
  Research: false,
};

export function StatusPill({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const live = status === "Live";
  const watch = watchSet[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
        className
      )}
      style={{ color: watch ? "var(--color-amber-ink)" : "var(--color-muted)" }}
    >
      {live ? (
        <LiveGlyph size={13} />
      ) : (
        <span
          aria-hidden
          className="size-2"
          style={
            watch
              ? { background: "var(--color-amber)" }
              : { border: "1px solid var(--color-muted)" }
          }
        />
      )}
      {status}
    </span>
  );
}
