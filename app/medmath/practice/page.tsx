"use client";

import { Suspense } from "react";
import { PracticeView } from "@/components/medmath/PracticeView";

export default function MedMathPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="text-sm text-[var(--color-ink-muted)]">Loading MedMath Practice...</span>
        </div>
      }
    >
      <PracticeView />
    </Suspense>
  );
}
