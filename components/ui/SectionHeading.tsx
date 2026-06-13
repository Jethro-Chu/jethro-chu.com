import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

interface SectionHeadingProps {
  /** small monospaced label e.g. "02 — Selected work" */
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <Reveal y={16}>
        <div className="inline-flex items-center gap-2.5">
          <span className="h-px w-8 bg-gradient-to-r from-iris to-transparent" />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
            {eyebrow}
          </span>
        </div>
      </Reveal>
      <Reveal y={22} delay={0.05}>
        <h2 className="max-w-3xl text-balance font-display text-section">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal y={20} delay={0.1}>
          <p
            className={cn(
              "max-w-xl text-pretty text-base leading-relaxed text-bone-dim sm:text-lg",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
