"use client";

import React, { useState } from "react";
import type {
  MedMathCategory,
  PracticeDifficultySelection,
  QuestionClientView,
} from "@/lib/medmath/types";
import { MEDMATH_CATEGORIES, MED_SURG_CATEGORIES, CRITICAL_CARE_CATEGORIES } from "@/lib/medmath/categories";
import { ExamEngine } from "@/components/medmath/ExamEngine";

function generateSessionUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "exam-" + Math.random().toString(36).substring(2, 12);
}

export default function MedMathExamPage() {
  const [isExamActive, setIsExamActive] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState<"all" | "med-surg" | "critical-care">("all");
  const [difficulty, setDifficulty] = useState<PracticeDifficultySelection>("mixed");
  const [examQuestions, setExamQuestions] = useState<QuestionClientView[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoadingExam, setIsLoadingExam] = useState<boolean>(false);

  const handleStartExam = async () => {
    setIsLoadingExam(true);
    const newSessionId = generateSessionUUID();
    setSessionId(newSessionId);

    const categories: MedMathCategory[] =
      selectedTrack === "med-surg"
        ? [...MED_SURG_CATEGORIES]
        : selectedTrack === "critical-care"
        ? [...CRITICAL_CARE_CATEGORIES]
        : MEDMATH_CATEGORIES.map((c) => c.id);

    try {
      // 1. Fetch generated exam question set
      const res = await fetch("/api/medmath/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isExam: true,
          examCount: questionCount,
          categories,
          difficulty,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { questions: QuestionClientView[] };
        setExamQuestions(data.questions);

        // 2. Initialize session in store
        await fetch("/api/medmath/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: newSessionId,
            sessionType: "exam",
            selectedCategories: categories,
            selectedDifficulty: difficulty,
            plannedQuestionCount: data.questions.length,
            completedQuestionCount: 0,
            startedAt: new Date().toISOString(),
            isCompleted: false,
            totalAttempts: 0,
            firstAttemptCorrectCount: 0,
            eventualCorrectCount: 0,
            totalHintsUsed: 0,
            totalSolutionsRevealed: 0,
            averageResponseTimeSeconds: 0,
          }),
        });

        setIsExamActive(true);
      }
    } catch (err) {
      console.error("Failed to initialize exam:", err);
    } finally {
      setIsLoadingExam(false);
    }
  };

  if (isExamActive && examQuestions.length > 0) {
    return (
      <ExamEngine
        initialQuestions={examQuestions}
        sessionId={sessionId}
        isTimed={isTimed}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Exam Setup Header */}
      <div className="space-y-2 border-b border-[var(--color-line)] pb-6">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-3 py-1 text-xs font-semibold text-white">
          <span>Examination Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-ink)]">
          Configure Practice Exam
        </h1>
        <p className="text-base text-[var(--color-ink-muted)] leading-relaxed">
          Simulate standard nursing school medication calculation examinations. Test across adult Medical-Surgical and Critical Care competencies with diagnostic results.
        </p>
      </div>

      {/* Setup Form Options */}
      <div className="space-y-6">
        {/* Question Count */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Question Count
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { count: 10, label: "10 Questions", note: "Quick diagnostic (~15 min)" },
                { count: 20, label: "20 Questions", note: "Standard exam (~30 min)" },
                { count: 25, label: "25 Questions", note: "Comprehensive (~40 min)" },
                { count: 50, label: "50 Questions", note: "Full mock exam (~75 min)" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setQuestionCount(opt.count)}
                className={`rounded-md border p-3.5 text-left transition-all ${
                  questionCount === opt.count
                    ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-1 ring-[var(--color-pine)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
                }`}
              >
                <div className="text-sm font-bold text-[var(--color-ink)]">
                  {opt.label}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  {opt.note}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Track Focus */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Curriculum Focus
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "all",
                  title: "All 13 Categories",
                  desc: "Comprehensive blend across Med-Surg and ICU.",
                },
                {
                  id: "med-surg",
                  title: "Med-Surg Floor",
                  desc: "Oral tablets, IVPB, gravity drips, insulin, simple infusions.",
                },
                {
                  id: "critical-care",
                  title: "Critical Care & ICU",
                  desc: "Vasoactive drips, heparin, inotropes, sedation, multi-step.",
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrack(t.id)}
                className={`rounded-md border p-4 text-left transition-all ${
                  selectedTrack === t.id
                    ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-1 ring-[var(--color-pine)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
                }`}
              >
                <div className="text-sm font-bold text-[var(--color-ink)]">
                  {t.title}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exam Mode (Timed vs Untimed) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Timing Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsTimed(true)}
              className={`rounded-md border p-4 text-left transition-all ${
                isTimed
                  ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-1 ring-[var(--color-pine)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
              }`}
            >
              <div className="text-sm font-bold text-[var(--color-ink)]">
                ⏱ Standard Timed Mode
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Tracks total elapsed time and per-question response velocity.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTimed(false)}
              className={`rounded-md border p-4 text-left transition-all ${
                !isTimed
                  ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-1 ring-[var(--color-pine)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
              }`}
            >
              <div className="text-sm font-bold text-[var(--color-ink)]">
                Untimed Practice Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Self-paced testing without clock pressure.
              </div>
            </button>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleStartExam}
            disabled={isLoadingExam}
            className="w-full rounded-sm bg-[var(--color-pine)] py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs transition-all hover:bg-[var(--color-pine)]/90 disabled:opacity-50"
          >
            {isLoadingExam ? "Generating Question Set..." : `Begin ${questionCount}-Question Exam →`}
          </button>
        </div>
      </div>
    </div>
  );
}
