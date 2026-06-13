import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Tag({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
        tone === "accent"
          ? "border-iris-soft/30 bg-iris/10 text-iris-soft"
          : "border-line bg-surface/40 text-bone-dim",
        className
      )}
    >
      {children}
    </span>
  );
}
