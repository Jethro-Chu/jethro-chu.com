"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { QuestionClientView, StoredSession } from "@/lib/medmath/types";
import { QuestionCard } from "./QuestionCard";

interface ExamEngineProps {
  initialQuestions: QuestionClientView[];
  sessionId: string;
  isTimed: boolean;
}

export function ExamEngine({ initialQuestions, sessionId, isTimed }: ExamEngineProps) {
  const router = useRouter();
  const [questions] = useState<QuestionClientView[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startTimestampRef = useRef<number>(Date.now());

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimestampRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(savedAnswers).filter((k) => Boolean(savedAnswers[k]?.trim())).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSaveAnswer = (answer: string) => {
    if (!currentQuestion) return;
    setSavedAnswers((prev) => ({
      ...prev,
      [currentQuestion.instanceId]: answer,
    }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmittingExam(true);
    try {
      // 1. Grade each question by submitting attempts
      let firstTryCorrect = 0;
      const categoryMap: Record<string, { totalQuestions: number; firstAttemptCorrect: number; eventualCorrect: number; totalAttempts: number; averageResponseTimeSeconds: number }> = {};
      const diffMap: Record<string, { totalQuestions: number; firstAttemptCorrect: number; eventualCorrect: number; totalAttempts: number; averageResponseTimeSeconds: number }> = {};

      const gradingPromises = questions.map(async (q) => {
        const studentAns = savedAnswers[q.instanceId] || "";
        const catKey = q.category;
        const diffKey = q.difficulty;

        if (!categoryMap[catKey]) categoryMap[catKey] = { totalQuestions: 0, firstAttemptCorrect: 0, eventualCorrect: 0, totalAttempts: 0, averageResponseTimeSeconds: 0 };
        if (!diffMap[diffKey]) diffMap[diffKey] = { totalQuestions: 0, firstAttemptCorrect: 0, eventualCorrect: 0, totalAttempts: 0, averageResponseTimeSeconds: 0 };

        categoryMap[catKey].totalQuestions += 1;
        categoryMap[catKey].totalAttempts += 1;
        diffMap[diffKey].totalQuestions += 1;
        diffMap[diffKey].totalAttempts += 1;

        if (!studentAns.trim()) {
          return { q, isCorrect: false };
        }

        const res = await fetch("/api/medmath/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceId: q.instanceId,
            sessionId,
            attemptNumber: 1,
            submittedAnswer: studentAns.trim(),
            responseTimeSeconds: Math.round(elapsedSeconds / questions.length),
            hintsUsedCount: 0,
            solutionRevealed: false,
          }),
        });

        if (res.ok) {
          const result = (await res.json()) as { isCorrect: boolean };
          if (result.isCorrect) {
            firstTryCorrect += 1;
            categoryMap[catKey].firstAttemptCorrect += 1;
            categoryMap[catKey].eventualCorrect += 1;
            diffMap[diffKey].firstAttemptCorrect += 1;
            diffMap[diffKey].eventualCorrect += 1;
          }
          return { q, isCorrect: result.isCorrect };
        }
        return { q, isCorrect: false };
      });

      await Promise.all(gradingPromises);

      // 2. Finalize session
      const completeRes = await fetch("/api/medmath/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sessionType: "exam",
          plannedQuestionCount: questions.length,
          completedQuestionCount: questions.length,
          totalAttempts: questions.length,
          firstAttemptCorrectCount: firstTryCorrect,
          eventualCorrectCount: firstTryCorrect,
          averageResponseTimeSeconds: Math.round(elapsedSeconds / questions.length),
          categoryBreakdown: categoryMap,
          difficultyBreakdown: diffMap,
        }),
      });

      if (completeRes.ok) {
        router.push(`/medmath/results/${sessionId}`);
      } else {
        router.push(`/medmath/results/${sessionId}`);
      }
    } catch (err) {
      console.error("Failed to finalize exam:", err);
      router.push(`/medmath/results/${sessionId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Exam Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm font-bold text-[var(--color-ink)]">
            Exam Mode
          </div>
          <div className="rounded-xs bg-[var(--color-sand)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-primary)]">
            ⏱ {formatTimer(elapsedSeconds)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-mono text-xs text-[var(--color-ink-muted)]">
            {answeredCount} of {questions.length} answered
          </div>
          <button
            type="button"
            onClick={() => {
              if (unansweredCount > 0) setShowConfirmModal(true);
              else handleFinalSubmit();
            }}
            disabled={isSubmittingExam}
            className="rounded-sm bg-[var(--color-pine)] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90 disabled:opacity-50"
          >
            {isSubmittingExam ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>

      {/* Question Palette Buttons */}
      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const hasAnswer = Boolean(savedAnswers[q.instanceId]?.trim());
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.instanceId}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex h-8 w-8 items-center justify-center rounded-sm font-mono text-xs transition-colors ${
                  isCurrent
                    ? "border-2 border-[var(--color-pine)] bg-[var(--color-pine)] text-white font-bold"
                    : hasAnswer
                    ? "border border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-semibold text-[var(--color-primary)]"
                    : "border border-[var(--color-line)] bg-[var(--color-sand)]/40 text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)]"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          isExamMode={true}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          examSavedAnswer={savedAnswers[currentQuestion.instanceId] || ""}
          onAnswerSavedForExam={handleSaveAnswer}
          onGradeAttempt={async () => null}
          onNextQuestion={() => {
            if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
          }}
        />
      )}

      {/* Bottom Prev / Next Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 font-mono text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)] disabled:opacity-40"
        >
          ← Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="rounded-sm bg-[var(--color-pine)] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[var(--color-pine)]/90"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (unansweredCount > 0) setShowConfirmModal(true);
              else handleFinalSubmit();
            }}
            disabled={isSubmittingExam}
            className="rounded-sm bg-[var(--color-pine)] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90 disabled:opacity-50"
          >
            {isSubmittingExam ? "Submitting..." : "Finish & Score Exam"}
          </button>
        )}
      </div>

      {/* Unanswered Questions Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-lg">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">
              Unanswered Questions
            </h3>
            <p className="mt-2 font-body text-sm text-[var(--color-ink-muted)]">
              You have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}. Unanswered questions will be scored as incorrect. Are you ready to submit?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-sm border border-[var(--color-line)] bg-[var(--color-sand)] px-4 py-2 font-mono text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinalSubmit();
                }}
                className="rounded-sm bg-[var(--color-pine)] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[var(--color-pine)]/90"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
