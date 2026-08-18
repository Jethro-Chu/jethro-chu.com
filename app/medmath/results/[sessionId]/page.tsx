import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/medmath/store";
import { CATEGORY_MAP } from "@/lib/medmath/categories";
import type { MedMathCategory } from "@/lib/medmath/types";

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

  const total = session.plannedQuestionCount || session.completedQuestionCount || 1;
  const correct = session.firstAttemptCorrectCount || 0;
  const scorePercent = Math.round((correct / total) * 100);

  const getVerdict = (pct: number) => {
    if (pct === 100) return { title: "100% Mastery Achieved", color: "text-emerald-700", note: "Meets strict zero-error clinical dosage benchmarks." };
    if (pct >= 90) return { title: "Clinical Safe-Dose Standard", color: "text-emerald-600", note: "Strong proficiency across adult medication administration." };
    if (pct >= 80) return { title: "Near Clinical Passing Standard", color: "text-amber-700", note: "Solid foundation; focus on weak categories before clinicals." };
    return { title: "Remediation Recommended", color: "text-red-700", note: "Additional focused calculation practice is strongly advised." };
  };

  const verdict = getVerdict(scorePercent);
  const weakCategories = session.weakCategories || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Top Results Card */}
      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-xs bg-[var(--color-pine)] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
          <span>Official Score Report</span>
        </div>

        <div>
          <div className="font-mono text-5xl sm:text-6xl font-extrabold text-[var(--color-ink)]">
            {scorePercent}%
          </div>
          <div className="mt-1 font-mono text-sm text-[var(--color-ink-muted)]">
            {correct} of {total} questions correct on first attempt
          </div>
        </div>

        <div className="pt-2">
          <div className={`font-display text-xl font-bold ${verdict.color}`}>
            {verdict.title}
          </div>
          <p className="font-body text-xs text-[var(--color-ink-muted)] mt-1">
            {verdict.note}
          </p>
        </div>

        {session.averageResponseTimeSeconds > 0 && (
          <div className="pt-2 font-mono text-xs text-[var(--color-ink-muted)]">
            Average response time: {session.averageResponseTimeSeconds} seconds per calculation
          </div>
        )}
      </div>

      {/* Weak Areas Diagnostics & 1-Click Practice Routing */}
      {weakCategories.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50/70 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
            <span>⚠ Identified Weak Areas</span>
          </div>
          <p className="font-body text-xs text-amber-900 leading-relaxed">
            The following categories fell below the 75% accuracy threshold during this session:
          </p>

          <div className="flex flex-wrap gap-2">
            {weakCategories.map((catKey) => {
              const meta = CATEGORY_MAP.get(catKey as MedMathCategory);
              return (
                <span
                  key={catKey}
                  className="rounded-xs border border-amber-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-amber-950"
                >
                  {meta?.name ?? catKey}
                </span>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href={`/medmath/practice?categories=${weakCategories.join(",")}`}
              className="inline-flex items-center rounded-sm bg-amber-900 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-amber-950"
            >
              Practice These Weak Areas Now →
            </Link>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      {session.categoryBreakdown && Object.keys(session.categoryBreakdown).length > 0 && (
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 px-5 py-3.5">
            <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] sm:text-base">
              Performance by Tested Competency
            </h3>
          </div>
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/20 text-[11px] text-[var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold text-right">Attempted</th>
                <th className="px-3 py-2.5 font-semibold text-right">Correct</th>
                <th className="px-4 py-2.5 font-semibold text-right">Accuracy</th>
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
                    <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">
                      {meta?.name ?? catKey}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--color-ink)]">
                      {stats.totalQuestions}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--color-ink)]">
                      {stats.firstAttemptCorrect}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--color-primary)]">
                      {catAcc}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--color-line)]">
        <Link
          href="/medmath/exam"
          className="rounded-sm bg-[var(--color-pine)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[var(--color-pine)]/90"
        >
          Take Another Exam
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/medmath/practice"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Practice Mode
          </Link>
          <Link
            href="/medmath/data"
            className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
          >
            Public Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
