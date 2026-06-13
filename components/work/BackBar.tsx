"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Slim sticky "back to work" affordance for case-study pages. */
export function BackBar() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-28 sm:px-8">
      <Link
        href="/#work"
        className="focus-ring group inline-flex items-center gap-2 rounded-full border border-line bg-surface/40 py-2 pl-3 pr-4 text-sm text-bone-dim backdrop-blur transition-colors hover:text-bone"
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        All work
      </Link>
    </div>
  );
}
