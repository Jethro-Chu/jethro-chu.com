"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Slim "back to work" affordance for case-study pages. */
export function BackBar() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 sm:px-8">
      <Link
        href="/#work"
        className="focus-ring group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          strokeWidth={1.75}
        />
        All work
      </Link>
    </div>
  );
}
