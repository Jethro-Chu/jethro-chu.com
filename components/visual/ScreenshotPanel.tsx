import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Honest neutral stand-in for a real product screenshot. No mock UI, no
 * "feature" implied, no gradients — just a flat clinical panel labelled
 * "screenshot coming" until a real image is dropped into public/shots.
 */
export function ScreenshotPanel({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-surface p-5",
        className
      )}
    >
      <div className="flex w-full max-w-[16rem] flex-col items-center gap-2 border-y border-line py-5 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          Screenshot coming
        </span>
        <span className="font-mono text-[11px] tracking-wide text-muted/70">
          {project.title}
        </span>
      </div>
    </div>
  );
}
