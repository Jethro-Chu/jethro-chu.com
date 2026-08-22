"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MedMathHeader() {
  const pathname = usePathname();

  const isPractice = pathname === "/medmath/practice";
  const isExam = pathname.startsWith("/medmath/exam");
  const isData = pathname === "/medmath/data";
  const isCanvas = pathname.startsWith("/medmath/canvas");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-line)] bg-[var(--color-sand)]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/medmath"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[var(--color-pine)] text-white shadow-xs">
            <span className="text-base font-bold">Rx</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              MedMath
            </span>
            <span className="text-xs font-medium text-[var(--color-ink-muted)]">
              Adult Dosage Lab
            </span>
          </div>
        </Link>

        <nav
          className={`${isCanvas ? "hidden sm:flex" : "flex"} items-center gap-1.5 sm:gap-2.5`}
        >
          <Link
            href="/medmath/practice"
            className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isPractice
                ? "bg-[var(--color-pine)] text-white shadow-xs font-semibold"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            }`}
          >
            Practice
          </Link>
          <Link
            href="/medmath/exam"
            className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isExam
                ? "bg-[var(--color-pine)] text-white shadow-xs font-semibold"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            }`}
          >
            Exam
          </Link>
          <Link
            href="/medmath/data"
            className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isData
                ? "bg-[var(--color-pine)] text-white shadow-xs font-semibold"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            }`}
          >
            Analytics
          </Link>
        </nav>
      </div>
    </header>
  );
}
