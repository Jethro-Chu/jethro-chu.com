"use client";

import type { SolutionStep } from "@/lib/medmath/types";

interface StepByStepSolutionProps {
  steps: SolutionStep[];
  expectedAnswer?: number | string;
  expectedUnit?: string;
}

export function StepByStepSolution({
  steps,
  expectedAnswer,
  expectedUnit,
}: StepByStepSolutionProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition-all">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Step-by-Step Clinical Solution
          </span>
        </div>
        {expectedAnswer !== undefined && (
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-[var(--color-ink)]">
            <span>Target:</span>
            <span className="rounded-xs bg-[var(--color-sand)] px-2 py-0.5 text-[var(--color-primary)]">
              {expectedAnswer} {expectedUnit}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.stepNumber}
            className="rounded-sm border border-[var(--color-line)]/60 bg-[var(--color-sand)]/60 p-3.5"
          >
            <div className="flex items-baseline gap-2 font-mono text-xs font-medium text-[var(--color-ink)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-pine)] text-[10px] font-bold text-white">
                {step.stepNumber}
              </span>
              <span className="font-semibold">{step.title}</span>
            </div>

            {step.formula && (
              <div className="mt-2 text-xs text-[var(--color-ink-muted)]">
                <span className="font-mono font-medium text-[var(--color-ink)]">Formula: </span>
                <span className="font-mono text-[var(--color-primary)]">{step.formula}</span>
              </div>
            )}

            {step.explanation && (
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                {step.explanation}
              </div>
            )}

            {step.calculation && (
              <div className="mt-2.5 rounded-xs bg-[var(--color-surface)] px-3 py-2 font-mono text-xs text-[var(--color-ink)]">
                <div className="text-[11px] text-[var(--color-ink-muted)]">Calculation:</div>
                <div className="font-bold text-[var(--color-primary)]">{step.calculation}</div>
              </div>
            )}

            {step.result && (
              <div className="mt-2 flex items-center justify-end font-mono text-xs font-semibold text-[var(--color-ink)]">
                <span>Result: </span>
                <span className="ml-1 text-[var(--color-primary)]">{step.result}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
