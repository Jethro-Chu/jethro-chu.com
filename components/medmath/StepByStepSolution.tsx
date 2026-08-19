"use client";

import type { SolutionStep } from "@/lib/medmath/types";

interface StepByStepSolutionProps {
  steps: SolutionStep[];
  correctAnswer?: number;
  answerUnit?: string;
  answerPrecision?: number;
}

export function StepByStepSolution({
  steps,
  correctAnswer,
  answerUnit,
  answerPrecision = 1,
}: StepByStepSolutionProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 transition-all">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            Step-by-Step Clinical Solution
          </span>
        </div>
        {typeof correctAnswer === "number" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <span>Correct Answer:</span>
            <span className="rounded-xs bg-[var(--color-sand)] px-2.5 py-0.5 font-bold text-emerald-700">
              {correctAnswer.toFixed(answerPrecision)} {answerUnit}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.stepNumber}
            className="rounded-sm border border-[var(--color-line)]/60 bg-[var(--color-sand)]/60 p-4"
          >
            <div className="flex items-baseline gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-pine)] text-[11px] font-bold text-white">
                {step.stepNumber}
              </span>
              <span>{step.title}</span>
            </div>

            {step.formula && (
              <div className="mt-2.5 text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">Formula: </span>
                <code className="font-mono text-sm font-medium text-[var(--color-primary)] bg-[var(--color-surface)] px-2 py-0.5 rounded-xs">
                  {step.formula}
                </code>
              </div>
            )}

            {step.explanation && (
              <div className="mt-2 text-sm text-[var(--color-ink)] leading-relaxed">
                {step.explanation}
              </div>
            )}

            {step.calculation && (
              <div className="mt-3 rounded-sm bg-[var(--color-surface)] px-3.5 py-2.5 border border-[var(--color-line)]/50">
                <div className="text-xs font-medium text-[var(--color-ink-muted)] mb-1">
                  Calculation:
                </div>
                <code className="font-mono text-sm font-semibold text-[var(--color-primary)]">
                  {step.calculation}
                </code>
              </div>
            )}

            {step.result && (
              <div className="mt-2.5 flex items-center justify-end text-sm font-medium text-[var(--color-ink)]">
                <span>Result: </span>
                <span className="ml-1.5 font-semibold text-[var(--color-primary)]">{step.result}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
