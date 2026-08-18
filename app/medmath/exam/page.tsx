"use client";

import React, { useState } from "react";
import type {
  ExamMode,
  MedMathCategory,
  PracticeDifficultySelection,
  QuestionClientView,
  RegularExamDifficulty,
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
  const [examMode, setExamMode] = useState<ExamMode>("nursing-med-math");
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<RegularExamDifficulty>("standard");
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [customCategories, setCustomCategories] = useState<MedMathCategory[]>(
    MEDMATH_CATEGORIES.map((c) => c.id),
  );

  const [examQuestions, setExamQuestions] = useState<QuestionClientView[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoadingExam, setIsLoadingExam] = useState<boolean>(false);

  const handleStartExam = async () => {
    setIsLoadingExam(true);
    const newSessionId = generateSessionUUID();
    setSessionId(newSessionId);

    const categories: MedMathCategory[] =
      examMode === "nursing-med-math"
        ? [...MED_SURG_CATEGORIES]
        : examMode === "critical-care"
        ? [...CRITICAL_CARE_CATEGORIES]
        : customCategories;

    try {
      // 1. Fetch generated exam question set
      const res = await fetch("/api/medmath/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isExam: true,
          examMode,
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
            examMode,
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

  const examTitles: Record<ExamMode, string> = {
    "nursing-med-math": "Nursing Med Math Exam",
    "critical-care": "Critical Care & ICU Exam",
    "custom": "Custom Blueprint Exam",
  };

  if (isExamActive && examQuestions.length > 0) {
    return (
      <ExamEngine
        initialQuestions={examQuestions}
        sessionId={sessionId}
        isTimed={isTimed}
        examMode={examMode}
        examModeTitle={examTitles[examMode]}
      />
    );
  }

  const toggleCustomCategory = (catId: MedMathCategory) => {
    setCustomCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Exam Setup Header */}
      <div className="space-y-2 border-b border-[var(--color-line)] pb-6">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-3 py-1 text-xs font-semibold text-white">
          <span>Examination Simulator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-ink)]">
          Nursing Medication Math Examination
        </h1>
        <p className="text-base text-[var(--color-ink-muted)] leading-relaxed">
          Simulate standard nursing school medication calculation examinations. Test core floor competencies or advanced critical care with realistic clinical orders, numeric answer entry, and diagnostic results.
        </p>
      </div>

      {/* Setup Form Options */}
      <div className="space-y-7">
        {/* Exam Mode Selection (3 Cards) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Select Examination Type
          </label>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {/* Card 1: Nursing Med Math Exam (Primary) */}
            <button
              type="button"
              onClick={() => setExamMode("nursing-med-math")}
              className={`rounded-md border p-4 sm:p-5 text-left transition-all relative ${
                examMode === "nursing-med-math"
                  ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-2 ring-[var(--color-pine)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-xs bg-[var(--color-pine)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Primary General Exam
                </span>
                {examMode === "nursing-med-math" && (
                  <span className="text-sm font-bold text-[var(--color-pine)]">✓ Selected</span>
                )}
              </div>
              <div className="mt-2.5 text-base font-bold text-[var(--color-ink)]">
                Nursing Med Math Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Traditional adult Med-Surg nursing exam. Balanced blend of conversions, tablets, oral liquids, IV pump rates, gravity drip rates, insulin, reconstitution, and basic weight-based dosing. No heavy ICU drips.
              </div>
            </button>

            {/* Card 2: Critical Care Exam */}
            <button
              type="button"
              onClick={() => setExamMode("critical-care")}
              className={`rounded-md border p-4 sm:p-5 text-left transition-all ${
                examMode === "critical-care"
                  ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-2 ring-[var(--color-pine)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-xs bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  ICU & High-Acuity
                </span>
                {examMode === "critical-care" && (
                  <span className="text-sm font-bold text-[var(--color-primary)]">✓ Selected</span>
                )}
              </div>
              <div className="mt-2.5 text-base font-bold text-[var(--color-ink)]">
                Critical Care Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Advanced high-acuity calculations: weight-based vasoactive drips (mcg/kg/min, mcg/min), heparin titration protocols, DKA insulin infusions, and multi-step ICU workflows.
              </div>
            </button>

            {/* Card 3: Custom Exam */}
            <button
              type="button"
              onClick={() => setExamMode("custom")}
              className={`rounded-md border p-4 sm:p-5 text-left transition-all ${
                examMode === "custom"
                  ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-2 ring-[var(--color-pine)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-xs bg-[var(--color-ink-muted)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Custom Blueprint
                </span>
                {examMode === "custom" && (
                  <span className="text-sm font-bold text-[var(--color-ink)]">✓ Selected</span>
                )}
              </div>
              <div className="mt-2.5 text-base font-bold text-[var(--color-ink)]">
                Custom Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Build your own personalized exam blueprint. Choose exact categories, question volume, and target difficulty.
              </div>
            </button>
          </div>
        </div>

        {/* Custom Categories Selector (shown only when Custom Exam is active) */}
        {examMode === "custom" && (
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Select Tested Categories ({customCategories.length} selected)
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomCategories(MEDMATH_CATEGORIES.map((c) => c.id))}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Select All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setCustomCategories(MED_SURG_CATEGORIES)}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  Med-Surg
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setCustomCategories(CRITICAL_CARE_CATEGORIES)}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  ICU
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {MEDMATH_CATEGORIES.map((cat) => {
                const isSelected = customCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2.5 rounded-sm border p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? "border-[var(--color-pine)] bg-[var(--color-pine)]/5 text-[var(--color-ink)]"
                        : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:bg-[var(--color-sand)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCustomCategory(cat.id)}
                      className="h-4 w-4 rounded-xs border-gray-300 text-[var(--color-pine)] focus:ring-[var(--color-pine)]"
                    />
                    <span>{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Count Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Exam Length
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { count: 10, label: "10 Questions", note: "Quick Diagnostic (~15 min)" },
                { count: 20, label: "20 Questions", note: "Standard Exam (~30 min)" },
                { count: 25, label: "25 Questions", note: "Comprehensive Mock (~40 min)" },
                { count: 50, label: "50 Questions", note: "Full Exam (~75 min)" },
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
                  {opt.count === 20 && (
                    <span className="ml-1.5 rounded-xs bg-[var(--color-pine)] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  {opt.note}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Exam Difficulty
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                {
                  id: "basic" as RegularExamDifficulty,
                  label: "Basic",
                  desc: "Straightforward one-step calculations.",
                  isDefault: false,
                },
                {
                  id: "standard" as RegularExamDifficulty,
                  label: "Standard",
                  desc: "Realistic mix of single and multi-step math.",
                  isDefault: true,
                },
                {
                  id: "hard" as RegularExamDifficulty,
                  label: "Hard",
                  desc: "Multi-step conversions, titration & rounding.",
                  isDefault: false,
                },
                {
                  id: "mixed" as RegularExamDifficulty,
                  label: "Mixed",
                  desc: "Comprehensive blend across all tiers.",
                  isDefault: false,
                },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`rounded-md border p-3.5 text-left transition-all ${
                  difficulty === d.id
                    ? "border-[var(--color-pine)] bg-[var(--color-pine)]/10 shadow-xs ring-1 ring-[var(--color-pine)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sand)]"
                }`}
              >
                <div className="text-sm font-bold text-[var(--color-ink)] flex items-center justify-between">
                  <span>{d.label}</span>
                  {d.isDefault && (
                    <span className="rounded-xs bg-[var(--color-pine)] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  {d.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exam Timing Format */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Timing Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                ⏱ Standard Timed Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Live clock tracking total elapsed exam duration and average calculation response velocity.
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
                Untimed Self-Paced Exam
              </div>
              <div className="mt-1 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Self-paced testing with zero clock pressure.
              </div>
            </button>
          </div>
        </div>

        {/* Study Benchmark Explanatory Notice */}
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-sand)]/60 p-4 text-xs text-[var(--color-ink-muted)] leading-relaxed flex items-start gap-3">
          <span className="text-base">ℹ</span>
          <div>
            <strong className="text-[var(--color-ink)]">Study Benchmark Notice:</strong> Our diagnostic grading includes a standard <strong className="text-[var(--color-ink)]">90% practice benchmark</strong> to help you build confidence and precision. Please note that individual nursing programs establish their own passing requirements (often between 80% and 100%).
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartExam}
            disabled={isLoadingExam || (examMode === "custom" && customCategories.length === 0)}
            className="w-full rounded-sm bg-[var(--color-pine)] py-3.5 text-base font-semibold text-white shadow-xs transition-all hover:bg-[var(--color-pine)]/90 disabled:opacity-50"
          >
            {isLoadingExam
              ? "Generating Examination Question Set..."
              : `Begin ${questionCount}-Question ${examTitles[examMode]} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
