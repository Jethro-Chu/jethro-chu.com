"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type {
  AttemptResult,
  MedMathCategory,
  PracticeDifficultySelection,
  QuestionClientView,
} from "@/lib/medmath/types";
import { MEDMATH_CATEGORIES } from "@/lib/medmath/categories";
import { TrackSelector } from "@/components/medmath/TrackSelector";
import { QuestionCard } from "@/components/medmath/QuestionCard";

function generateSessionUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "sess-" + Math.random().toString(36).substring(2, 12);
}

export interface PracticeViewProps {
  fixedCategories?: MedMathCategory[];
  heading?: string;
  description?: string;
  hideFilters?: boolean;
}

export function PracticeView({
  fixedCategories,
  heading,
  description,
  hideFilters = false,
}: PracticeViewProps = {}) {
  const searchParams = useSearchParams();

  // Category / Template filter from URL params if present
  const rawCategoryParam = searchParams.get("category") as MedMathCategory | null;
  const initialCategoryParam = rawCategoryParam === "heparin" ? "anticoagulants" : rawCategoryParam;
  const initialCategoriesParam = searchParams.get("categories");
  const initialTemplatesParam = searchParams.get("templates");
  const isMissedPractice = searchParams.get("mode") === "missed";

  const targetTemplates = useMemo(() => {
    if (!initialTemplatesParam) return undefined;
    const list = initialTemplatesParam.split(",").filter(Boolean);
    return list.length > 0 ? list : undefined;
  }, [initialTemplatesParam]);

  const [selectedCategories, setSelectedCategories] = useState<MedMathCategory[]>(() => {
    if (fixedCategories?.length) return fixedCategories;
    if (initialCategoryParam && MEDMATH_CATEGORIES.some((c) => c.id === initialCategoryParam)) {
      return [initialCategoryParam];
    }
    if (initialCategoriesParam) {
      const parsed = initialCategoriesParam.split(",") as MedMathCategory[];
      const valid = parsed.filter((c) => MEDMATH_CATEGORIES.some((meta) => meta.id === c));
      if (valid.length > 0) return valid;
    }
    return MEDMATH_CATEGORIES.map((c) => c.id);
  });

  const [selectedDifficulty, setSelectedDifficulty] = useState<PracticeDifficultySelection>("mixed");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionClientView | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [showTrackSelector, setShowTrackSelector] = useState(false);

  // Session KPI state
  const sessionIdRef = useRef<string>(generateSessionUUID());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctFirstTryCount, setCorrectFirstTryCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const fetchNextQuestion = useCallback(
    async (excludeId?: string) => {
      setIsLoadingQuestion(true);
      try {
        const res = await fetch("/api/medmath/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: targetTemplates && targetTemplates.length > 0 ? undefined : (fixedCategories ?? selectedCategories),
            difficulty: targetTemplates && targetTemplates.length > 0 ? undefined : selectedDifficulty,
            templateIds: targetTemplates,
            excludeTemplateIds: excludeId ? [excludeId] : [],
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { question: QuestionClientView };
          if (data.question) {
            setCurrentQuestion(data.question);
          }
        }
      } catch (err) {
        console.error("Failed to load question:", err);
      } finally {
        setIsLoadingQuestion(false);
      }
    },
    [fixedCategories, selectedCategories, selectedDifficulty, targetTemplates],
  );

  // Fetch first question on load or filter change
  useEffect(() => {
    fetchNextQuestion();
  }, [fetchNextQuestion]);

  const handleGradeAttempt = async (
    submittedAnswer: string,
    attemptNumber: number,
    responseTimeSeconds: number,
    hintsUsedCount: number,
    solutionRevealed: boolean,
  ): Promise<AttemptResult | null> => {
    if (!currentQuestion) return null;

    try {
      const res = await fetch("/api/medmath/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: currentQuestion.instanceId,
          sessionId: sessionIdRef.current,
          attemptNumber,
          submittedAnswer,
          responseTimeSeconds,
          hintsUsedCount,
          solutionRevealed,
        }),
      });

      if (!res.ok) return null;
      const result = (await res.json()) as AttemptResult;

      if (attemptNumber === 1) {
        setQuestionsAnswered((prev) => prev + 1);
        if (result.isCorrect) {
          setCorrectFirstTryCount((prev) => prev + 1);
          setCurrentStreak((prev) => {
            const next = prev + 1;
            setBestStreak((b) => Math.max(b, next));
            return next;
          });
        } else {
          setCurrentStreak(0);
        }
      }

      return result;
    } catch (err) {
      console.error("Failed to grade attempt:", err);
      return null;
    }
  };

  const handleNext = () => {
    if (currentQuestion) {
      fetchNextQuestion(currentQuestion.templateId);
    } else {
      fetchNextQuestion();
    }
  };

  const firstTryPercent =
    questionsAnswered > 0 ? Math.round((correctFirstTryCount / questionsAnswered) * 100) : 0;

  return (
    <div className="space-y-6">
      {heading && (
        <div className="space-y-2 border-b border-[var(--color-line)] pb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Medication + Math
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] sm:text-4xl">{heading}</h1>
          {description && <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>}
        </div>
      )}
      {/* Top Practice Bar: Session Metrics & Filter Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <div>
            <span className="text-[var(--color-ink-muted)]">Practiced: </span>
            <span className="font-bold text-[var(--color-ink)]">{questionsAnswered}</span>
          </div>
          <div>
            <span className="text-[var(--color-ink-muted)]">1st Try: </span>
            <span className="font-bold text-[var(--color-primary)]">
              {questionsAnswered > 0 ? `${firstTryPercent}%` : "—"}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-ink-muted)]">Streak: </span>
            <span className="font-bold text-[var(--color-ink)]">
              {currentStreak} {currentStreak > 0 ? "🔥" : ""}
            </span>
          </div>
          {bestStreak > 0 && (
            <div className="hidden sm:block">
              <span className="text-[var(--color-ink-muted)]">Best: </span>
              <span className="font-bold text-[var(--color-ink)]">{bestStreak}</span>
            </div>
          )}
        </div>

        {!hideFilters && (
          <button
            type="button"
            onClick={() => setShowTrackSelector((prev) => !prev)}
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-sand)]/60 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)]"
          >
            {showTrackSelector ? "Hide Focus Filters ▲" : "Focus Filters ▾"}
          </button>
        )}
      </div>

      {/* Missed Questions Active Banner */}
      {isMissedPractice && targetTemplates && targetTemplates.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-ink)]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-primary)]">🎯 Targeted Remediation:</span>
            <span>Practicing concepts missed during your recent exam with fresh randomized values.</span>
          </div>
          <span className="rounded-xs bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-semibold text-white">
            {targetTemplates.length} Concepts
          </span>
        </div>
      )}

      {/* Filter Options */}
      {!hideFilters && showTrackSelector && (
        <TrackSelector
          selectedCategories={selectedCategories}
          onSelectCategories={setSelectedCategories}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={setSelectedDifficulty}
        />
      )}

      {/* Question Presentation */}
      {isLoadingQuestion ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-12">
          <div className="flex flex-col items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            <span>Loading Clinical Scenario...</span>
          </div>
        </div>
      ) : currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          onGradeAttempt={handleGradeAttempt}
          onNextQuestion={handleNext}
        />
      ) : (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-base text-[var(--color-ink)]">
            No questions available for the selected filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategories(MEDMATH_CATEGORIES.map((c) => c.id));
              setSelectedDifficulty("mixed");
            }}
            className="mt-4 rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
