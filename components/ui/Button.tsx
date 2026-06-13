"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/motion/Magnetic";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** show the arrow affordance */
  arrow?: boolean;
  magnetic?: boolean;
  external?: boolean;
}

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-300 focus-ring select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-bone text-ink hover:bg-white shadow-[0_8px_30px_-8px_rgba(241,239,233,0.35)]",
  outline:
    "border border-line bg-surface/40 text-bone hover:border-iris-soft/50 hover:bg-surface",
  ghost: "text-bone-dim hover:text-bone",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  arrow = false,
  magnetic = false,
  external = false,
}: ButtonProps) {
  const content = (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      <span className="relative z-10">{children}</span>
      {arrow && (
        <ArrowUpRight
          className="relative z-10 size-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
          strokeWidth={2}
        />
      )}
    </Link>
  );

  return magnetic ? <Magnetic className="inline-block">{content}</Magnetic> : content;
}
