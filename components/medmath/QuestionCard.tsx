"use client";

import React, { useState, useEffect, useRef } from "react";
import type {
  AttemptResult,
  MedMathCategory,
  MedMathDifficulty,
  QuestionClientView,
  SolutionStep,
} from "@/lib/medmath/types";
import { CATEGORY_MAP } from "@/lib/medmath/categories";
import { ProgressiveHints } from "./ProgressiveHints";
import { StepByStepSolution } from "./StepByStepSolution";

interface QuestionCardProps {
  question: QuestionClientView;
  onGradeAttempt: (
    submittedAnswer: string,
    attemptNumber: number,
    responseTimeSeconds: number,
    hintsUsedCount: number,
    solutionRevealed: boolean,
  ) => Promise<AttemptResult | null>;
  onNextQuestion: () => void;
  isExamMode?: boolean;
  questionIndex?: number;
  totalQuestions?: number;
  onAnswerSavedForExam?: (submittedAnswer: string) => void;
  examSavedAnswer?: string;
}

export function QuestionCard({
  question,
  onGradeAttempt,
  onNextQuestion,
  isExamMode = false,
  questionIndex,
  totalQuestions,
  onAnswerSavedForExam,
  examSavedAnswer = "",
}: QuestionCardProps) {
  const [submittedAnswer, setSubmittedAnswer] = useState(examSavedAnswer);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradeResult, setGradeResult] = useState<AttemptResult | null>(null);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[] | null>(null);
  const [isRevealingSolution, setIsRevealingSolution] = useState(false);
  const [solutionRevealedManually, setSolutionRevealedManually] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state on new question
  useEffect(() => {
    setSubmittedAnswer(examSavedAnswer || "");
    setAttemptNumber(1);
    setGradeResult(null);
    setRevealedHints([]);
    setSolutionSteps(null);
    setIsRevealingSolution(false);
    setSolutionRevealedManually(false);
    startTimeRef.current = Date.now();

    // Auto-focus answer input on desktop
    if (typeof window !== "undefined" && window.innerWidth > 640) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [question.instanceId, examSavedAnswer]);

  const handleRevealHint = async () => {
    if (isLoadingHint) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch("/api/medmath/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: question.instanceId,
          action: "hint",
          hintIndex: revealedHints.length,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { hint: string };
        if (data.hint) {
          setRevealedHints((prev) => [...prev, data.hint]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch hint", e);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleRevealSolution = async () => {
    if (isRevealingSolution || solutionSteps) return;
    setIsRevealingSolution(true);
    try {
      const res = await fetch("/api/medmath/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: question.instanceId,
          action: "reveal-solution",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          solutionSteps: SolutionStep[];
          expectedAnswer: string | number;
          expectedUnit: string;
        };
        setSolutionSteps(data.solutionSteps);
        setSolutionRevealedManually(true);
      }
    } catch (e) {
      console.error("Failed to fetch solution", e);
    } finally {
      setIsRevealingSolution(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!submittedAnswer.trim() || isSubmitting) return;

    if (isExamMode) {
      if (onAnswerSavedForExam) {
        onAnswerSavedForExam(submittedAnswer.trim());
      }
      return;
    }

    setIsSubmitting(true);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const result = await onGradeAttempt(
        submittedAnswer.trim(),
        attemptNumber,
        elapsedSeconds,
        revealedHints.length,
        solutionRevealedManually,
      );

      if (result) {
        setGradeResult(result);
        if (result.solutionSteps) {
          setSolutionSteps(result.solutionSteps);
        }
      }
    } catch (err) {
      console.error("Grading failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setAttemptNumber((prev) => prev + 1);
    setGradeResult(null);
    setSubmittedAnswer("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const catMeta = CATEGORY_MAP.get(question.category);

  return (
    <div className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xs">
      {/* Header bar with metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xs bg-[var(--color-pine)] px-2.5 py-1 text-xs font-semibold text-white">
            {catMeta?.name ?? question.category}
          </span>
          <span className="rounded-xs border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
            {question.difficulty.replace("-", " ")}
          </span>
          {question.clinicalContext && (
            <span className="hidden text-xs text-[var(--color-ink-muted)] sm:inline">
              • {question.clinicalContext}
            </span>
          )}
        </div>

        {isExamMode && questionIndex !== undefined && totalQuestions !== undefined && (
          <div className="text-xs font-semibold text-[var(--color-ink)]">
            Question {questionIndex + 1} of {totalQuestions}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Scenario description - 16–18px readable body */}
        <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-ink)]">
          {question.scenario}
        </p>

        {/* Clinical Medication Order Banner */}
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-sand)]/80 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-pine)] text-[10px] font-bold text-white">
              Rx
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Physician Order
            </span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
            {question.orderText}
          </div>
        </div>

        {/* Available Drug Supply & Patient Info */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.availableText && (
            <div className="rounded-sm border border-[var(--color-line)]/70 bg-[var(--color-surface)] p-3.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Available Supply
              </div>
              <div className="mt-1 text-sm sm:text-base font-medium text-[var(--color-ink)]">
                {question.availableText}
              </div>
            </div>
          )}

          {(question.patientWeightKg !== undefined || question.patientWeightLb !== undefined) && (
            <div className="rounded-sm border border-[var(--color-line)]/70 bg-[var(--color-surface)] p-3.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Patient Adult Weight
              </div>
              <div className="mt-1 flex items-baseline gap-2 text-sm sm:text-base font-semibold text-[var(--color-ink)]">
                {question.patientWeightKg !== undefined && (
                  <span>{question.patientWeightKg} kg</span>
                )}
                {question.patientWeightLb !== undefined && (
                  <span className="text-[var(--color-ink-muted)] font-normal">
                    ({question.patientWeightLb} lb)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Prompt question */}
        <div className="border-t border-[var(--color-line)]/60 pt-4">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-ink)] leading-snug">
            {question.prompt}
          </h3>
          {question.roundingInstruction && (
            <div className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
              ℹ {question.roundingInstruction}
            </div>
          )}
        </div>

        {/* Answer Submission Form */}
        {!isExamMode ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Answer:
                </span>
                <div className="relative flex-1 max-w-xs">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    value={submittedAnswer}
                    onChange={(e) => setSubmittedAnswer(e.target.value)}
                    disabled={Boolean(gradeResult?.isCorrect) || isSubmitting}
                    placeholder="Enter value"
                    className="w-full rounded-sm border border-[var(--color-line)] bg-white/70 px-3.5 py-2.5 pr-20 text-base font-medium text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-semibold text-[var(--color-ink-muted)]">
                    {question.expectedUnit}
                  </div>
                </div>
              </div>

              {!gradeResult ? (
                <button
                  type="submit"
                  disabled={!submittedAnswer.trim() || isSubmitting}
                  className="inline-flex items-center justify-center rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? "Checking..." : "Check Answer"}
                </button>
              ) : gradeResult.isCorrect ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-3.5 py-2 text-sm font-semibold text-white">
                    <span>✓</span>
                    <span>Correct</span>
                  </div>
                  <button
                    type="button"
                    onClick={onNextQuestion}
                    className="inline-flex items-center justify-center rounded-sm bg-[var(--color-pine)] px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90"
                  >
                    Next Question →
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-sm border border-red-300 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700">
                    <span>✗</span>
                    <span>Not quite (Attempt {attemptNumber})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)]"
                  >
                    Try Again
                  </button>
                  {!solutionSteps && (
                    <button
                      type="button"
                      onClick={handleRevealSolution}
                      disabled={isRevealingSolution}
                      className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
                    >
                      {isRevealingSolution ? "Loading..." : "Show Solution"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onNextQuestion}
                    className="rounded-sm bg-[var(--color-pine)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-pine)]/90"
                  >
                    Skip to Next →
                  </button>
                </div>
              )}
            </div>

            {/* Practice hints */}
            {!gradeResult?.isCorrect && (
              <ProgressiveHints
                revealedHints={revealedHints}
                onRevealNextHint={handleRevealHint}
                isLoading={isLoadingHint}
                disabled={Boolean(gradeResult?.isCorrect)}
              />
            )}
          </form>
        ) : (
          /* Exam Mode Input */
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Answer:
              </span>
              <div className="relative flex-1 max-w-xs">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  value={submittedAnswer}
                  onChange={(e) => {
                    setSubmittedAnswer(e.target.value);
                    if (onAnswerSavedForExam) onAnswerSavedForExam(e.target.value);
                  }}
                  placeholder="Enter value"
                  className="w-full rounded-sm border border-[var(--color-line)] bg-white/70 px-3.5 py-2.5 pr-20 text-base font-medium text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-hidden"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-semibold text-[var(--color-ink-muted)]">
                  {question.expectedUnit}
                </div>
              </div>
            </div>
            <div className="text-xs text-[var(--color-ink-muted)]">
              Your answer is automatically saved as you navigate between questions.
            </div>
          </div>
        )}

        {/* Step-by-Step Educational Solution (shown on correct or when revealed) */}
        {solutionSteps && (
          <StepByStepSolution
            steps={solutionSteps}
            expectedAnswer={gradeResult?.expectedAnswer}
            expectedUnit={gradeResult?.expectedUnit ?? question.expectedUnit}
          />
        )}
      </div>
    </div>
  );
}
