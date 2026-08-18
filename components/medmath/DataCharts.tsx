"use client";

import React from "react";
import type { PublicMedMathData } from "@/lib/medmath/types";

interface DataChartsProps {
  data: PublicMedMathData;
  timeRange: "7d" | "30d" | "90d" | "all";
  onSelectTimeRange: (range: "7d" | "30d" | "90d" | "all") => void;
}

export function DataCharts({ data, timeRange, onSelectTimeRange }: DataChartsProps) {
  const {
    summary,
    categories,
    hardestTopics,
    mostMissedSubtypes,
    difficulties,
    attemptsDistribution,
    trackComparison,
    hintStats,
  } = data;

  const hasData = summary.totalQuestionsAnswered > 0;

  return (
    <div className="space-y-8">
      {/* Time Range Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Aggregate Platform Analytics
          </span>
          <p className="font-body text-xs text-[var(--color-ink-muted)]">
            Anonymous aggregate performance data from nursing students and clinicians practicing MedMath.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTimeRange(t.id)}
              className={`rounded-sm px-3 py-1.5 font-mono text-xs transition-colors ${
                timeRange === t.id
                  ? "bg-[var(--color-pine)] text-white font-semibold shadow-xs"
                  : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            Questions Answered
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--color-ink)]">
            {summary.totalQuestionsAnswered.toLocaleString()}
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            Practice Sessions
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--color-ink)]">
            {summary.totalPracticeSessions.toLocaleString()}
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            1st-Try Accuracy
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--color-primary)]">
            {hasData ? `${summary.firstAttemptAccuracy}%` : "—"}
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            Eventual Accuracy
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--color-ink)]">
            {hasData ? `${summary.eventualAccuracy}%` : "—"}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            Median Solve Time
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-[var(--color-ink)]">
            {hasData && summary.medianResponseTimeSeconds > 0
              ? `${summary.medianResponseTimeSeconds}s`
              : "—"}
          </div>
        </div>
      </div>

      {/* Track Comparison Cards (Med-Surg Floor vs ICU Critical Care) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Med-Surg Floor Track
            </span>
            <span className="rounded-xs bg-[var(--color-sand)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-muted)]">
              Oral · IVPB · Gravity · Insulin
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">Questions</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">
                {trackComparison.medSurg.questionsAttempted.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">1st Attempt</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-primary)]">
                {trackComparison.medSurg.questionsAttempted > 0
                  ? `${trackComparison.medSurg.firstAttemptAccuracy}%`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">Median Time</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">
                {trackComparison.medSurg.questionsAttempted > 0
                  ? `${trackComparison.medSurg.medianResponseTimeSeconds}s`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Critical Care & ICU Track
            </span>
            <span className="rounded-xs bg-[var(--color-sand)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-muted)]">
              Vasopressors · Inotropes · Sedation · Multi-Step
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">Questions</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">
                {trackComparison.criticalCare.questionsAttempted.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">1st Attempt</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-primary)]">
                {trackComparison.criticalCare.questionsAttempted > 0
                  ? `${trackComparison.criticalCare.firstAttemptAccuracy}%`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-muted)]">Median Time</div>
              <div className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">
                {trackComparison.criticalCare.questionsAttempted > 0
                  ? `${trackComparison.criticalCare.medianResponseTimeSeconds}s`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance Breakdown Table */}
      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 px-5 py-3.5">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] sm:text-base">
            Performance by Clinical Topic (All 13 Adult Categories)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/20 text-[11px] text-[var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Track</th>
                <th className="px-3 py-2.5 font-semibold text-right">Practiced</th>
                <th className="px-3 py-2.5 font-semibold text-right">1st-Try %</th>
                <th className="px-3 py-2.5 font-semibold text-right">Eventual %</th>
                <th className="px-3 py-2.5 font-semibold text-right">Median Time</th>
                <th className="px-4 py-2.5 font-semibold text-right">Hint Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/60">
              {categories.map((cat) => (
                <tr key={cat.category} className="hover:bg-[var(--color-sand)]/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">
                    {cat.name}
                  </td>
                  <td className="px-3 py-3 text-[var(--color-ink-muted)]">
                    {cat.track === "med-surg" ? "Med-Surg" : "ICU"}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--color-ink)]">
                    {cat.totalQuestions.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-[var(--color-primary)]">
                    {cat.totalQuestions > 0 ? `${cat.firstAttemptAccuracy}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--color-ink)]">
                    {cat.totalQuestions > 0 ? `${cat.eventualAccuracy}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--color-ink-muted)]">
                    {cat.totalQuestions > 0 && cat.medianResponseTimeSeconds > 0
                      ? `${cat.medianResponseTimeSeconds}s`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-ink-muted)]">
                    {cat.totalQuestions > 0 ? `${cat.hintUsageRate}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardest Topics & Most Missed Subtypes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Hardest Topics */}
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-3">
            Hardest Adult Topics (Lowest 1st-Attempt Accuracy)
          </h3>
          {hardestTopics.length > 0 ? (
            <div className="space-y-3">
              {hardestTopics.slice(0, 5).map((topic, idx) => (
                <div key={topic.category} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-medium text-[var(--color-ink)]">
                      {idx + 1}. {topic.name}
                    </span>
                    <span className="font-bold text-[var(--color-primary)]">
                      {topic.firstAttemptAccuracy}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-sand)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-pine)] rounded-full"
                      style={{ width: `${Math.max(5, topic.firstAttemptAccuracy)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-xs text-[var(--color-ink-muted)]">
              Requires at least 5 questions per category to rank hardest topics.
            </p>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-3">
            Performance by Difficulty Tier
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {difficulties.map((diff) => (
              <div
                key={diff.difficulty}
                className="flex items-center justify-between rounded-sm border border-[var(--color-line)]/60 bg-[var(--color-sand)]/30 p-2.5"
              >
                <div className="capitalize font-semibold text-[var(--color-ink)]">
                  {diff.difficulty.replace("-", " ")}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--color-ink-muted)]">
                    {diff.totalQuestions} questions
                  </span>
                  <span className="font-bold text-[var(--color-primary)]">
                    {diff.totalQuestions > 0 ? `${diff.firstAttemptAccuracy}%` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attempts Required & Hint Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-3">
            Attempt Distribution
          </h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-muted)]">Solved on 1st Attempt:</span>
              <span className="font-bold text-[var(--color-ink)]">{attemptsDistribution.firstAttemptPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-muted)]">Solved on 2nd Attempt:</span>
              <span className="font-bold text-[var(--color-ink)]">{attemptsDistribution.secondAttemptPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-muted)]">Solved on 3rd+ Attempt:</span>
              <span className="font-bold text-[var(--color-ink)]">{attemptsDistribution.thirdOrLaterPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-muted)]">Needed Progressive Hint:</span>
              <span className="font-bold text-[var(--color-ink)]">{attemptsDistribution.afterHintPercent}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xs">
          <h3 className="font-display text-sm font-semibold text-[var(--color-ink)] mb-3">
            Most Challenging Question Types
          </h3>
          {mostMissedSubtypes.length > 0 ? (
            <div className="space-y-2 font-mono text-xs">
              {mostMissedSubtypes.slice(0, 4).map((sub) => (
                <div key={sub.subtype} className="flex items-center justify-between border-b border-[var(--color-line)]/40 pb-1.5">
                  <span className="text-[var(--color-ink)]">{sub.title}</span>
                  <span className="font-bold text-[var(--color-primary)]">{sub.firstAttemptAccuracy}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-xs text-[var(--color-ink-muted)]">
              Specific subtype listing requires sample-size protection (minimum 20 aggregate attempts per question format).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
