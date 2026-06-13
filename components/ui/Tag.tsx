import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Mono meta chip — squared, hairline. Used for stack items. */
export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
