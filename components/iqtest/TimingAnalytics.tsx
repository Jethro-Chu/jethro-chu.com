"use client";

import { useMemo, useState } from "react";
import type {
  TimedAttemptPoint,
  TimingAnalytics as TimingAnalyticsData,
} from "@/lib/iqtest/results";
import styles from "./IQTest.module.css";

type TimingFilter =
  | "all"
  | "iq110"
  | "iq115"
  | "iq120"
  | "under20"
  | "20to40"
  | "over40";
type TimingSort = "recent" | "highest" | "lowest" | "fastest" | "slowest";

interface TimingAnalyticsProps {
  analytics: TimingAnalyticsData | null;
  status: "idle" | "loading" | "ready" | "unavailable";
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainder
        .toString()
        .padStart(2, "0")}`
    : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatOrdinal(value: number) {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function matchesFilter(attempt: TimedAttemptPoint, filter: TimingFilter) {
  if (filter === "iq110") return attempt.iqScore >= 110;
  if (filter === "iq115") return attempt.iqScore >= 115;
  if (filter === "iq120") return attempt.iqScore >= 120;
  if (filter === "under20") return attempt.completionTimeSeconds < 20 * 60;
  if (filter === "20to40") {
    return (
      attempt.completionTimeSeconds >= 20 * 60 &&
      attempt.completionTimeSeconds < 40 * 60
    );
  }
  if (filter === "over40") return attempt.completionTimeSeconds >= 40 * 60;
  return true;
}

export function TimingAnalytics({ analytics, status }: TimingAnalyticsProps) {
  const [filter, setFilter] = useState<TimingFilter>("all");
  const [sort, setSort] = useState<TimingSort>("recent");
  const [hideLongAttempts, setHideLongAttempts] = useState(false);

  const filteredAttempts = useMemo(
    () =>
      (analytics?.attempts ?? []).filter(
        (attempt) =>
          matchesFilter(attempt, filter) &&
          (!hideLongAttempts || attempt.completionTimeSeconds <= 90 * 60),
      ),
    [analytics, filter, hideLongAttempts],
  );
  const sortedAttempts = useMemo(() => {
    const attempts = [...filteredAttempts];
    if (sort === "highest") attempts.sort((a, b) => b.iqScore - a.iqScore);
    if (sort === "lowest") attempts.sort((a, b) => a.iqScore - b.iqScore);
    if (sort === "fastest") {
      attempts.sort(
        (a, b) => a.completionTimeSeconds - b.completionTimeSeconds,
      );
    }
    if (sort === "slowest") {
      attempts.sort(
        (a, b) => b.completionTimeSeconds - a.completionTimeSeconds,
      );
    }
    if (sort === "recent") {
      attempts.sort(
        (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
      );
    }
    return attempts;
  }, [filteredAttempts, sort]);
  const maximumSeconds = Math.max(
    10 * 60,
    ...filteredAttempts.map((attempt) => attempt.completionTimeSeconds),
  );
  const chartMaximumSeconds = Math.ceil(maximumSeconds / 600) * 600;

  return (
    <section className={styles.timingSection} aria-labelledby="timing-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.sectionLabel}>Timing telemetry</p>
          <h2 id="timing-title">IQ vs. Completion Time</h2>
        </div>
        {analytics && (
          <p className={styles.bestResult}>
            {analytics.timedAttemptCount.toLocaleString()} timed{" "}
            {analytics.timedAttemptCount === 1 ? "attempt" : "attempts"}
          </p>
        )}
      </div>

      {(status === "idle" || status === "loading") && (
        <p className={styles.comparisonStatus} role="status">
          Adding completion time to the timing comparison…
        </p>
      )}

      {status === "unavailable" && (
        <p className={styles.comparisonStatus} role="status">
          Your completion time is safe in this browser. Timing comparisons are
          temporarily unavailable.
        </p>
      )}

      {status === "ready" && analytics && analytics.timedAttemptCount > 0 && (
        <>
          <div className={styles.timingSummary}>
            <p>
              <span>Median time</span>
              <strong>{formatTime(analytics.medianCompletionSeconds)}</strong>
            </p>
            <p>
              <span>Average time</span>
              <strong>{formatTime(analytics.averageCompletionSeconds)}</strong>
            </p>
            <p>
              <span>Fastest time</span>
              <strong>{formatTime(analytics.fastestCompletionSeconds)}</strong>
            </p>
            <p>
              <span>Middle 50%</span>
              <strong className={styles.timingRange}>
                {formatTime(analytics.percentile25Seconds)} to{" "}
                {formatTime(analytics.percentile75Seconds)}
              </strong>
            </p>
          </div>

          <div className={styles.timingControls}>
            <label>
              <span>Chart filter</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as TimingFilter)}
              >
                <option value="all">All timed attempts</option>
                <option value="iq110">IQ 110+</option>
                <option value="iq115">IQ 115+</option>
                <option value="iq120">IQ 120+</option>
                <option value="under20">Under 20 minutes</option>
                <option value="20to40">20–40 minutes</option>
                <option value="over40">40+ minutes</option>
              </select>
            </label>
            <label className={styles.longTimeToggle}>
              <input
                type="checkbox"
                checked={hideLongAttempts}
                onChange={(event) => setHideLongAttempts(event.target.checked)}
              />
              <span>Hide attempts over 90 minutes</span>
            </label>
          </div>

          {filteredAttempts.length > 0 ? (
            <figure className={styles.scatterFigure}>
              <div className={styles.scatterChart}>
                <div className={styles.scatterYAxis} aria-hidden="true">
                  <span>129</span>
                  <span>105</span>
                  <span>80</span>
                  <span>32</span>
                </div>
                <div
                  className={styles.scatterPlot}
                  role="group"
                  aria-label={`Scatter plot of ${filteredAttempts.length} timed IQ test attempts. Completion time is on the horizontal axis and IQ score is on the vertical axis.`}
                >
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  {filteredAttempts.map((attempt) => {
                    const left =
                      (attempt.completionTimeSeconds / chartMaximumSeconds) * 100;
                    const bottom = ((attempt.iqScore - 32) / (129 - 32)) * 100;
                    const speedText =
                      attempt.speedPercentile === null
                        ? "Speed percentile pending"
                        : `${formatOrdinal(attempt.speedPercentile)} speed percentile`;
                    return (
                      <button
                        type="button"
                        className={`${styles.scatterPoint} ${
                          attempt.isCurrentAttempt ? styles.scatterPointCurrent : ""
                        }`}
                        style={{ left: `${left}%`, bottom: `${bottom}%` }}
                        key={attempt.pointId}
                        aria-label={`IQ ${attempt.iqScore}, ${attempt.correctCount} correct, completion time ${formatTime(attempt.completionTimeSeconds)}, ${speedText}`}
                      >
                        <span className={styles.scatterTooltip}>
                          <strong>IQ {attempt.iqScore}</strong>
                          <span>Score: {attempt.correctCount} / 25</span>
                          <span>Time: {formatTime(attempt.completionTimeSeconds)}</span>
                          <span>
                            {attempt.speedPercentile === null
                              ? "Speed percentile after 25 attempts"
                              : `Speed percentile: ${formatOrdinal(attempt.speedPercentile)}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.scatterXAxis} aria-hidden="true">
                  <span>0</span>
                  <span>{Math.round(chartMaximumSeconds / 120)} min</span>
                  <span>{Math.round(chartMaximumSeconds / 60)} min</span>
                </div>
                <span className={styles.yAxisTitle}>IQ score</span>
                <span className={styles.xAxisTitle}>Completion time</span>
              </div>
              <figcaption>
                Each point is an anonymous timed attempt. Completion time is
                context only and never changes the IQ score.
              </figcaption>
            </figure>
          ) : (
            <p className={styles.comparisonStatus}>
              No timed attempts match these filters.
            </p>
          )}

          <div className={styles.timingTableHeader}>
            <h3>Timed attempts</h3>
            <label>
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as TimingSort)}
              >
                <option value="recent">Most recent</option>
                <option value="highest">Highest IQ</option>
                <option value="lowest">Lowest IQ</option>
                <option value="fastest">Fastest completion</option>
                <option value="slowest">Slowest completion</option>
              </select>
            </label>
          </div>
          <div className={styles.timingTableWrap}>
            <table className={styles.timingTable}>
              <thead>
                <tr>
                  <th>IQ</th>
                  <th>Correct</th>
                  <th>Completion time</th>
                  <th>Speed percentile</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttempts.map((attempt) => (
                  <tr key={attempt.pointId}>
                    <td>{attempt.iqScore}</td>
                    <td>{attempt.correctCount} / 25</td>
                    <td>{formatTime(attempt.completionTimeSeconds)}</td>
                    <td>
                      {attempt.speedPercentile === null
                        ? "Early sample"
                        : `Faster than ${attempt.speedPercentile}%`}
                    </td>
                    <td>{formatDate(attempt.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {analytics.speedPercentile === null && (
            <p className={styles.earlySampleNote}>
              Speed percentiles appear after 25 timed attempts. Historical
              untimed attempts are excluded.
            </p>
          )}
        </>
      )}
    </section>
  );
}
