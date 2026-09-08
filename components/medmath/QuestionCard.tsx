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

function AnswerControl({
  question,
  value,
  onChange,
  disabled,
  inputRef,
}: {
  question: QuestionClientView;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (question.responseType === "numeric") {
    return (
      <div className="flex min-w-0 flex-1 max-w-sm items-center rounded-sm border border-[var(--color-line-strong)] bg-[var(--color-surface)] focus-within:border-[var(--color-primary)]">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          aria-label={`Answer in ${question.answerUnit}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="Enter value"
          className="w-full min-w-0 rounded-sm bg-transparent px-3.5 py-2.5 font-mono text-base font-medium text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-500"
        />
        <div className="pointer-events-none shrink-0 pr-3.5 font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
          {question.answerUnit}
        </div>
      </div>
    );
  }

  const selectedMask = Number(value || 0);
  return (
    <fieldset className="w-full space-y-2" disabled={disabled}>
      <legend className="sr-only">
        {question.responseType === "select-all" ? "Select all correct answers" : "Select one answer"}
      </legend>
      {question.options?.map((option, index) => {
        const checked = question.responseType === "select-all"
          ? Boolean(selectedMask & (1 << index))
          : value === option.id;
        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 text-sm leading-relaxed transition-colors ${
              checked
                ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 text-[var(--color-ink)]"
                : "border-[var(--color-line)] bg-white/60 text-[var(--color-ink)] hover:bg-[var(--color-sand)]/60"
            }`}
          >
            <input
              type={question.responseType === "select-all" ? "checkbox" : "radio"}
              name={`answer-${question.instanceId}`}
              checked={checked}
              onChange={() => {
                if (question.responseType === "select-all") {
                  onChange(String(selectedMask ^ (1 << index)));
                } else {
                  onChange(option.id);
                }
              }}
              className="mt-0.5 h-4 w-4 accent-[var(--color-pine)]"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
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
  const [requestError, setRequestError] = useState<string | null>(null);
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
    setRequestError(null);
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
    setRequestError(null);
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
      if (!res.ok) throw new Error("Request failed");
      if (res.ok) {
        const data = (await res.json()) as { hint: string };
        if (data.hint) {
          setRevealedHints((prev) => [...prev, data.hint]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch hint", e);
      setRequestError("The hint could not be loaded. Please try again.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleRevealSolution = async () => {
    if (isRevealingSolution || solutionSteps) return;
    setIsRevealingSolution(true);
    setRequestError(null);
    try {
      const res = await fetch("/api/medmath/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: question.instanceId,
          action: "reveal-solution",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      if (res.ok) {
        const data = (await res.json()) as {
          solutionSteps: SolutionStep[];
          correctAnswer: number;
          correctAnswerLabel?: string;
          answerUnit: string;
          answerPrecision: number;
          safetyPearl?: string;
        };
        setSolutionSteps(data.solutionSteps);
        setGradeResult((prev) => ({
          attemptId: prev?.attemptId ?? "revealed",
          instanceId: question.instanceId,
          isCorrect: prev?.isCorrect ?? false,
          attemptNumber: prev?.attemptNumber ?? 1,
          feedback: "Solution revealed.",
          solutionSteps: data.solutionSteps,
          correctAnswer: data.correctAnswer,
          correctAnswerLabel: data.correctAnswerLabel,
          answerUnit: data.answerUnit,
          answerPrecision: data.answerPrecision,
          safetyPearl: data.safetyPearl,
        }));
        setSolutionRevealedManually(true);
      }
    } catch (e) {
      console.error("Failed to fetch solution", e);
      setRequestError("The solution could not be loaded. Please try again.");
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
    setRequestError(null);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const result = await onGradeAttempt(
        submittedAnswer.trim(),
        attemptNumber,
        elapsedSeconds,
        revealedHints.length,
        solutionRevealedManually,
      );

      if (!result) throw new Error("Grading unavailable");
      if (result) {
        setGradeResult(result);
        if (result.solutionSteps) {
          setSolutionSteps(result.solutionSteps);
        }
      }
    } catch (err) {
      console.error("Grading failed", err);
      setRequestError("Your answer could not be checked. Please try again.");
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
  const hasAnswer = question.responseType === "select-all"
    ? Number(submittedAnswer) > 0
    : Boolean(submittedAnswer.trim());
  const updateAnswer = (value: string) => {
    setSubmittedAnswer(value);
    if (isExamMode) onAnswerSavedForExam?.(value);
  };

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

        {/* Clinical information or medication order */}
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-sand)]/80 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-pine)] text-[10px] font-bold text-white">
              Rx
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              {(question.questionKind ?? "calculation") === "calculation" ? "Medication Order" : "Clinical Focus"}
            </span>
          </div>
          <div className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
            <span className="whitespace-pre-line">{question.orderText}</span>
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
                Patient Weight
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

        {question.responseType === "numeric" && (
          <p className="text-sm text-[var(--color-muted)]">
            Round only the final answer as directed. Use a leading zero (0.5), no trailing zeros (5, not 5.0), and enter the value in the unit shown.
          </p>
        )}
        {requestError && <p role="alert" className="text-sm text-[var(--color-critical)]">{requestError}</p>}
        <span role="status" className="sr-only">{gradeResult ? (gradeResult.isCorrect ? "Correct answer" : "Answer not correct. Try again or review the solution.") : ""}</span>
        {/* Answer Submission Form */}
        {!isExamMode ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Answer:
                </span>
                <AnswerControl
                  question={question}
                  value={submittedAnswer}
                  onChange={updateAnswer}
                  disabled={Boolean(gradeResult?.isCorrect) || isSubmitting}
                  inputRef={inputRef}
                />
              </div>

              {!gradeResult ? (
                <button
                  type="submit"
                  disabled={!hasAnswer || isSubmitting}
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
              <AnswerControl
                question={question}
                value={submittedAnswer}
                onChange={updateAnswer}
                inputRef={inputRef}
              />
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
            correctAnswer={gradeResult?.correctAnswer}
            correctAnswerLabel={gradeResult?.correctAnswerLabel}
            answerUnit={gradeResult?.answerUnit ?? question.answerUnit}
            answerPrecision={gradeResult?.answerPrecision ?? question.answerPrecision}
            safetyPearl={gradeResult?.safetyPearl}
          />
        )}
      </div>
    </div>
  );
}
