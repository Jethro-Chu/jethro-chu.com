import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/medmath/store";
import { CATEGORY_MAP } from "@/lib/medmath/categories";
import { formatAnswer } from "@/lib/medmath/rounding";
import type { ExamQuestionReview, MedMathCategory } from "@/lib/medmath/types";
import { StepByStepSolution } from "@/components/medmath/StepByStepSolution";

interface ResultsPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function MedMathResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) {
    return notFound();
  }

  if (session.isInvalidated) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="space-y-5 rounded-md border border-amber-300 bg-amber-50 p-6 sm:p-8">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Result invalidated
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">
            This exam cannot be graded reliably.
          </h1>
          <p className="leading-relaxed text-[var(--color-ink-muted)]">
            {session.invalidationReason}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/medmath/exam"
              className="rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Retake the exam
            </Link>
            <Link
              href="/medmath/practice"
              className="rounded-sm border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)]"
            >
              Practice first
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = session.plannedQuestionCount || session.completedQuestionCount || 1;
  const correct = session.firstAttemptCorrectCount || 0;
  const incorrect = total - correct;
  const scorePercent = Math.round((correct / total) * 100);
  const benchmarkMet = scorePercent >= 90;

  const getVerdict = (pct: number) => {
    if (pct === 100) return { title: "100% Zero-Error Mastery", color: "text-emerald-700", note: "Outstanding precision. Meets zero-error medication safety standards." };
    if (pct >= 90) return { title: "Practice Benchmark Met", color: "text-emerald-700", note: "Solid mathematical competency across adult clinical calculations." };
    if (pct >= 80) return { title: "Near Benchmark Standard", color: "text-amber-700", note: "Good foundation; targeted practice on missed concepts is advised." };
    return { title: "Remediation Recommended", color: "text-red-700", note: "Focused practice on core formulas is strongly recommended before clinicals." };
  };

  const verdict = getVerdict(scorePercent);
  const weakCategories = session.weakCategories || [];
  const examReview: ExamQuestionReview[] = session.examReview || [];
  const formatReviewAnswer = (item: ExamQuestionReview, submitted: string) => {
    if (!submitted) return "No answer submitted (blank)";
    if ((item.responseType ?? "numeric") === "numeric") return `${submitted} ${item.answerUnit}`;
    if (item.responseType === "multiple-choice") {
      return item.options?.find((option) => option.id === submitted)?.label ?? submitted;
    }
    const mask = Number(submitted);
    return item.options
      ?.filter((_, index) => Boolean(mask & (1 << index)))
      .map((option) => option.label)
      .join("; ") || "No answer submitted (blank)";
  };
  const subtypePerformance = new Map<string, { title: string; total: number; correct: number }>();
  for (const item of examReview) {
    const current = subtypePerformance.get(item.subtype) ?? {
      title: item.title,
      total: 0,
      correct: 0,
    };
    current.total += 1;
    if (item.isCorrect) current.correct += 1;
    subtypePerformance.set(item.subtype, current);
  }
  const weakSubtypes = Array.from(subtypePerformance.values()).filter(
    (item) => item.total >= 2 && item.correct / item.total < 0.75,
  );

  // Extract unique template IDs of missed questions for targeted practice
  const missedTemplateIds = examReview
    .filter((item) => !item.isCorrect)
    .map((item) => item.templateId)
    .filter(Boolean);

  const formatElapsed = (avgSecs: number, totalQ: number) => {
    if (!avgSecs || avgSecs === 0) return "Untimed";
    const totalSecs = avgSecs * totalQ;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Results Banner */}
      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-3 py-1 text-xs font-semibold text-white">
          <span>{session.examMode === "critical-care" ? "Critical Care Exam Report" : "Nursing Med Math Exam Report"}</span>
        </div>

        {/* Score Display */}
        <div>
          <div className="text-5xl sm:text-6xl font-extrabold text-[var(--color-ink)]">
            {scorePercent}%
          </div>
          <div className="mt-2 text-base font-semibold text-[var(--color-ink)]">
            {correct} of {total} Questions Correct
          </div>
          <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
            {correct} correct · {incorrect} incorrect
          </div>
        </div>

        {/* Practice Benchmark Badge & Note */}
        <div className="max-w-md mx-auto rounded-sm border p-3.5 text-xs text-left sm:text-center leading-relaxed">
          <div className="flex items-center justify-center gap-2 font-bold">
            {benchmarkMet ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <span>✓</span> Practice Benchmark Met (90% Target Achieved)
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1">
                <span>⚠</span> Below 90% Practice Benchmark
              </span>
            )}
          </div>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Our 90% benchmark is a study target. Individual nursing school programs establish their own passing requirements (typically 80%–100%).
          </p>
        </div>

        {/* Timing & Velocity */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-1 text-xs text-[var(--color-ink-muted)] border-t border-[var(--color-line)]/60">
          <div>
            <span>Total Time: </span>
            <strong className="text-[var(--color-ink)]">
              {formatElapsed(session.averageResponseTimeSeconds, total)}
            </strong>
          </div>
          {session.averageResponseTimeSeconds > 0 && (
            <div>
              <span>Average Velocity: </span>
              <strong className="text-[var(--color-ink)]">
                {session.averageResponseTimeSeconds}s / calculation
              </strong>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {missedTemplateIds.length > 0 ? (
            <Link
              href={`/medmath/practice?mode=missed&templates=${missedTemplateIds.join(",")}`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90"
            >
              <span>🎯 Practice Missed Concepts ({missedTemplateIds.length})</span>
            </Link>
          ) : (
            <Link
              href="/medmath/practice"
              className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[var(--color-pine)]/90"
            >
              <span>Practice All Categories</span>
            </Link>
          )}

          <Link
            href="/medmath/exam"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)]"
          >
            Take Another Exam
          </Link>
        </div>
      </div>

      {/* Weak Areas Notice if accuracy < 75% in any category */}
      {weakCategories.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50/70 p-5 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <span>⚠ Needs Review (Categories &lt; 75% Accuracy)</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {weakCategories.map((catKey) => {
              const meta = CATEGORY_MAP.get(catKey as MedMathCategory);
              return (
                <span
                  key={catKey}
                  className="rounded-xs border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-950"
                >
                  {meta?.name ?? catKey}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {weakSubtypes.length > 0 && (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <h3 className="text-sm font-bold text-[var(--color-ink)]">Needs Review</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
            {weakSubtypes.map((item) => (
              <li key={item.title}>{item.title}: {item.correct} of {item.total} correct</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Performance Breakdown Table */}
      {session.categoryBreakdown && Object.keys(session.categoryBreakdown).length > 0 && (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 px-5 py-3.5">
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Performance by Tested Competency
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/20 text-xs font-semibold text-[var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-3 py-3 text-right">Attempted</th>
                <th className="px-3 py-3 text-right">Correct</th>
                <th className="px-4 py-3 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/60">
              {Object.entries(session.categoryBreakdown).map(([catKey, stats]) => {
                const meta = CATEGORY_MAP.get(catKey as MedMathCategory);
                const catAcc =
                  stats.totalQuestions > 0
                    ? Math.round((stats.firstAttemptCorrect / stats.totalQuestions) * 100)
                    : 0;
                return (
                  <tr key={catKey} className="hover:bg-[var(--color-sand)]/20">
                    <td className="px-4 py-3.5 font-medium text-[var(--color-ink)]">
                      {meta?.name ?? catKey}
                    </td>
                    <td className="px-3 py-3.5 text-right font-medium text-[var(--color-ink)]">
                      {stats.totalQuestions}
                    </td>
                    <td className="px-3 py-3.5 text-right text-[var(--color-ink)]">
                      {stats.firstAttemptCorrect}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[var(--color-primary)]">
                      {catAcc}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Comprehensive Question-by-Question Review */}
      {examReview.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="border-b border-[var(--color-line)] pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
              Question-by-Question Review & Worked Solutions
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Review every calculation from your examination, including your submitted response, the correct answer, and step-by-step mathematical solutions.
            </p>
          </div>

          <div className="space-y-6">
            {examReview.map((item, idx) => (
              <div
                key={item.instanceId || idx}
                className={`rounded-md border p-5 sm:p-7 space-y-5 bg-[var(--color-surface)] shadow-xs ${
                  item.isCorrect
                    ? "border-emerald-200"
                    : "border-red-200"
                }`}
              >
                {/* Review Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)]/70 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-ink)]">
                      Question {idx + 1}
                    </span>
                    <span className="rounded-xs bg-[var(--color-pine)] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {item.categoryName || item.category}
                    </span>
                    <span className="rounded-xs border border-[var(--color-line)] bg-[var(--color-sand)]/50 px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
                      {item.difficulty}
                    </span>
                  </div>

                  <div>
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        <span>✓</span> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                        <span>✗</span> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                {/* Scenario */}
                <p className="text-base text-[var(--color-ink)] leading-relaxed">
                  {item.scenario}
                </p>

                {/* Rx Order */}
                <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-sand)]/70 p-3.5 sm:p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
                    {item.questionKind === "calculation" ? "Physician Order" : "Clinical Focus"}
                  </div>
                  <div className="text-base font-semibold text-[var(--color-ink)]">
                    {item.orderText}
                  </div>
                </div>

                {/* Available Supply / Patient Weight */}
                {(item.availableText || item.patientWeightKg !== undefined) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {item.availableText && (
                      <div className="rounded-sm border border-[var(--color-line)]/70 bg-white/60 p-3">
                        <span className="font-semibold text-[var(--color-ink-muted)]">Available Supply: </span>
                        <span className="font-medium text-[var(--color-ink)]">{item.availableText}</span>
                      </div>
                    )}
                    {item.patientWeightKg !== undefined && (
                      <div className="rounded-sm border border-[var(--color-line)]/70 bg-white/60 p-3">
                        <span className="font-semibold text-[var(--color-ink-muted)]">Patient Adult Weight: </span>
                        <span className="font-bold text-[var(--color-ink)]">
                          {item.patientWeightKg} kg {item.patientWeightLb ? `(${item.patientWeightLb} lb)` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt */}
                <div className="pt-1">
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-ink)]">
                    {item.prompt}
                  </h4>
                  {item.roundingInstruction && (
                    <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      ℹ {item.roundingInstruction}
                    </div>
                  )}
                </div>

                {/* Student Answer vs Correct Answer Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-sm border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Your Submitted Answer
                    </div>
                    <div className={`mt-1 text-base font-bold ${item.isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                      {formatReviewAnswer(item, item.studentAnswer)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Correct Answer
                    </div>
                    <div className="mt-1 text-base font-bold text-emerald-700">
                      {item.correctAnswerLabel ?? `${formatAnswer(item.correctAnswer, item.answerPrecision)} ${item.answerUnit}`}
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Educational Solution */}
                {item.solutionSteps && item.solutionSteps.length > 0 && (
                  <StepByStepSolution
                    steps={item.solutionSteps}
                    correctAnswer={item.correctAnswer}
                    correctAnswerLabel={item.correctAnswerLabel}
                    answerUnit={item.answerUnit}
                    answerPrecision={item.answerPrecision}
                    safetyPearl={item.safetyPearl}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[var(--color-line)]">
        <div className="flex items-center gap-3">
          {missedTemplateIds.length > 0 && (
            <Link
              href={`/medmath/practice?mode=missed&templates=${missedTemplateIds.join(",")}`}
              className="rounded-sm bg-[var(--color-pine)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[var(--color-pine)]/90"
            >
              Practice Missed Concepts ({missedTemplateIds.length})
            </Link>
          )}
          <Link
            href="/medmath/exam"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Take Another Exam
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/medmath/practice"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Practice by Category
          </Link>
          <Link
            href="/medmath/data"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Public Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
