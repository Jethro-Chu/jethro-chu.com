import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "link";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  arrow?: boolean;
  external?: boolean;
}

const base =
  "group/btn inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-ring select-none";

const variants: Record<Variant, string> = {
  primary:
    "rounded-[var(--radius-sm)] bg-ink text-bg hover:bg-[#22302b] border border-ink",
  outline:
    "rounded-[var(--radius-sm)] border border-line bg-surface text-ink hover:border-ink",
  link: "text-accent-ink underline decoration-1 underline-offset-4 decoration-[color-mix(in_oklab,var(--color-accent)_45%,transparent)] hover:decoration-accent",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  arrow = false,
  external = false,
}: ButtonProps) {
  const isLink = variant === "link";
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], !isLink && sizes[size], className)}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
          strokeWidth={1.75}
        />
      )}
    </Link>
  );
}
