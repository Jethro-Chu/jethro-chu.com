"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PublicAttemptSort,
  PublicDistributionBin,
  PublicIQDataResponse,
  PublicTimedPoint,
} from "@/lib/iqtest/public-data";
import styles from "./IQData.module.css";

type IQFilter = "all" | "100" | "110" | "115" | "120";

function formatTime(seconds: number | null) {
  if (seconds === null) return "—";
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
    timeZone: "UTC",
  }).format(new Date(value));
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <p className={styles.summaryCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function BarChart({
  bins,
  ariaLabel,
  dense = false,
}: {
  bins: PublicDistributionBin[];
  ariaLabel: string;
  dense?: boolean;
}) {
  const maximum = Math.max(1, ...bins.map((bin) => bin.count));
  return (
    <div
      className={`${styles.barChart} ${dense ? styles.barChartDense : ""}`}
      role="img"
      aria-label={ariaLabel}
    >
      {bins.map((bin, index) => (
        <div className={styles.barColumn} key={bin.label}>
          <span className={styles.barCount}>{bin.count || ""}</span>
          <span className={styles.barWell} aria-hidden="true">
            <i
              style={{
                height: bin.count
                  ? `${Math.max(4, (bin.count / maximum) * 100)}%`
                  : "0%",
              }}
            />
          </span>
          <span
            className={`${styles.barLabel} ${
              dense && index % 5 !== 0 && index !== bins.length - 1
                ? styles.barLabelMinor
                : ""
            }`}
          >
            {bin.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScatterPlot({ points }: { points: PublicTimedPoint[] }) {
  const maximumSeconds = Math.max(
    10 * 60,
    ...points.map((point) => point.completionTimeSeconds),
  );
  const chartMaximumSeconds = Math.ceil(maximumSeconds / 600) * 600;

  return (
    <figure className={styles.figure}>
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
          aria-label={`Scatter plot of ${points.length} anonymous timed test attempts. Completion time is on the horizontal axis and IQ score is on the vertical axis.`}
        >
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          {points.map((point) => {
            const left =
              (point.completionTimeSeconds / chartMaximumSeconds) * 100;
            const bottom = ((point.iqScore - 32) / 97) * 100;
            return (
              <button
                type="button"
                className={styles.scatterPoint}
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
                key={point.pointId}
                aria-label={`IQ ${point.iqScore}, ${point.correctCount} correct, completion time ${formatTime(point.completionTimeSeconds)}${
                  point.speedPercentile === null
                    ? ""
                    : `, faster than ${point.speedPercentile}% of timed test takers`
                }`}
              >
                <span className={styles.tooltip}>
                  <strong>IQ {point.iqScore}</strong>
                  <span>Score: {point.correctCount} / 25</span>
                  <span>Time: {formatTime(point.completionTimeSeconds)}</span>
                  <span>
                    {point.speedPercentile === null
                      ? "Speed percentile pending"
                      : `Faster than ${point.speedPercentile}%`}
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
        Each point is one anonymous timed attempt. Tap or focus a point for details.
      </figcaption>
    </figure>
  );
}

export function IQData({
  initialData,
}: {
  initialData: PublicIQDataResponse | null;
}) {
  const [data, setData] = useState(initialData);
  const [sort, setSort] = useState<PublicAttemptSort>("recent");
  const [page, setPage] = useState(1);
  const [iqFilter, setIQFilter] = useState<IQFilter>("all");
  const [hideLongAttempts, setHideLongAttempts] = useState(false);
  const [status, setStatus] = useState<"ready" | "loading" | "unavailable">(
    initialData ? "ready" : "loading",
  );
  const initialRequestHandled = useRef(false);

  useEffect(() => {
    if (!initialRequestHandled.current) {
      initialRequestHandled.current = true;
      if (initialData) return;
    }
    const controller = new AbortController();
    setStatus("loading");
    void fetch(`/api/iqtest/data?page=${page}&pageSize=20&sort=${sort}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
        return (await response.json()) as PublicIQDataResponse;
      })
      .then((response) => {
        setData(response);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("unavailable");
      });
    return () => controller.abort();
  }, [initialData, page, sort]);

  const filteredPoints = useMemo(() => {
    const threshold = iqFilter === "all" ? 0 : Number(iqFilter);
    return (data?.timing.points ?? []).filter(
      (point) =>
        point.iqScore >= threshold &&
        (!hideLongAttempts || point.completionTimeSeconds <= 90 * 60),
    );
  }, [data, hideLongAttempts, iqFilter]);

  const updateSort = (nextSort: PublicAttemptSort) => {
    setSort(nextSort);
    setPage(1);
  };

  return (
    <main id="main" className={styles.shell}>
      <div className={styles.routeLine} aria-hidden="true" />
      <div className={styles.page}>
        <header className={styles.hero}>
          <nav className={styles.routeNav} aria-label="IQ test pages">
            <a href="/iqtest">← Take the Test</a>
            <span aria-current="page">View Data</span>
          </nav>
          <p className={styles.kicker}>Public participant data</p>
          <h1>IQ Test Data</h1>
          <div className={styles.totalCompleted}>
            <strong>{data?.overview.testsCompleted.toLocaleString() ?? "—"}</strong>
            <span>Tests Completed</span>
          </div>
        </header>

        {status === "unavailable" && !data && (
          <section className={styles.status} role="status">
            Live test data is temporarily unavailable. Please try again shortly.
          </section>
        )}

        {data && (
          <>
            <section className={styles.section} aria-labelledby="overview-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Overview</p>
                  <h2 id="overview-title">The current sample</h2>
                </div>
                {status === "loading" && <span className={styles.loading}>Updating…</span>}
              </div>
              <div className={styles.summaryGrid}>
                <SummaryCard
                  label="Tests completed"
                  value={data.overview.testsCompleted.toLocaleString()}
                />
                <SummaryCard label="Average IQ" value={data.overview.averageIQ.toFixed(1)} />
                <SummaryCard label="Median IQ" value={String(data.overview.medianIQ)} />
                <SummaryCard label="Highest IQ" value={String(data.overview.highestIQ)} />
                <SummaryCard
                  label="Average score"
                  value={`${data.overview.averageCorrect.toFixed(1)} / 25`}
                />
              </div>
            </section>

            <section className={styles.section} aria-labelledby="iq-distribution-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Score telemetry</p>
                  <h2 id="iq-distribution-title">IQ Distribution</h2>
                </div>
                <p className={styles.sectionMeta}>All valid attempts</p>
              </div>
              <figure className={styles.figure}>
                <BarChart
                  bins={data.iqDistribution}
                  ariaLabel={`Distribution of ${data.overview.testsCompleted} anonymous IQ scores.`}
                />
                <figcaption>Number of test takers in each IQ score range.</figcaption>
              </figure>
              <div className={styles.detailStats}>
                <SummaryCard label="Average IQ" value={data.overview.averageIQ.toFixed(1)} />
                <SummaryCard label="Median IQ" value={String(data.overview.medianIQ)} />
                <SummaryCard label="25th percentile" value={String(data.overview.percentile25IQ)} />
                <SummaryCard label="75th percentile" value={String(data.overview.percentile75IQ)} />
              </div>
            </section>

            <section className={styles.section} aria-labelledby="raw-score-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Raw performance</p>
                  <h2 id="raw-score-title">Score Distribution</h2>
                </div>
                <p className={styles.sectionMeta}>Correct answers out of 25</p>
              </div>
              <figure className={styles.figure}>
                <BarChart
                  bins={data.scoreDistribution}
                  ariaLabel={`Distribution of raw scores from zero through 25 correct answers.`}
                  dense
                />
                <figcaption>Every historical and future valid attempt is included.</figcaption>
              </figure>
            </section>

            <section className={styles.section} aria-labelledby="percentiles-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Relative standing</p>
                  <h2 id="percentiles-title">IQ Percentiles</h2>
                </div>
              </div>
              <div className={styles.percentileGrid}>
                {data.iqPercentiles.map((percentile) => (
                  <p key={percentile.label}>
                    <span>{percentile.label}</span>
                    <strong>IQ {percentile.iqScore}+</strong>
                  </p>
                ))}
              </div>
            </section>

            <section className={styles.section} aria-labelledby="timing-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Timed attempts only</p>
                  <h2 id="timing-title">IQ vs. Completion Time</h2>
                </div>
                <p className={styles.sectionMeta}>
                  {data.timing.timedTests.toLocaleString()} timed tests
                </p>
              </div>

              {data.timing.timedTests === 0 ? (
                <div className={styles.emptyTiming}>
                  <p>Timing data begins with newly completed tests.</p>
                  <span>
                    Historical attempts remain in every IQ and raw-score statistic above.
                  </span>
                </div>
              ) : (
                <>
                  <div className={styles.summaryGridFour}>
                    <SummaryCard
                      label="Timed tests"
                      value={data.timing.timedTests.toLocaleString()}
                    />
                    <SummaryCard
                      label="Median time"
                      value={formatTime(data.timing.medianSeconds)}
                    />
                    <SummaryCard
                      label="Average time"
                      value={formatTime(data.timing.averageSeconds)}
                    />
                    <SummaryCard
                      label="Fastest time"
                      value={formatTime(data.timing.fastestSeconds)}
                    />
                  </div>

                  <div className={styles.controls}>
                    <label>
                      <span>High-score view</span>
                      <select
                        value={iqFilter}
                        onChange={(event) => setIQFilter(event.target.value as IQFilter)}
                      >
                        <option value="all">All IQ scores</option>
                        <option value="100">IQ 100+</option>
                        <option value="110">IQ 110+</option>
                        <option value="115">IQ 115+</option>
                        <option value="120">IQ 120+</option>
                      </select>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={hideLongAttempts}
                        onChange={(event) => setHideLongAttempts(event.target.checked)}
                      />
                      <span>Hide attempts over 90 minutes</span>
                    </label>
                  </div>

                  {filteredPoints.length > 0 ? (
                    <ScatterPlot points={filteredPoints} />
                  ) : (
                    <p className={styles.status}>No timed attempts match this view.</p>
                  )}

                  <div className={styles.timingColumns}>
                    <div>
                      <h3>Speed percentiles</h3>
                      <dl className={styles.telemetryList}>
                        <div><dt>10th percentile</dt><dd>{formatTime(data.timing.percentile10Seconds)}</dd></div>
                        <div><dt>25th percentile</dt><dd>{formatTime(data.timing.percentile25Seconds)}</dd></div>
                        <div><dt>Median</dt><dd>{formatTime(data.timing.medianSeconds)}</dd></div>
                        <div><dt>75th percentile</dt><dd>{formatTime(data.timing.percentile75Seconds)}</dd></div>
                        <div><dt>90th percentile</dt><dd>{formatTime(data.timing.percentile90Seconds)}</dd></div>
                      </dl>
                    </div>
                    <div>
                      <h3>Time distribution</h3>
                      <BarChart
                        bins={data.timing.distribution}
                        ariaLabel="Distribution of valid completion times."
                      />
                    </div>
                  </div>

                  <aside className={styles.aboutTime}>
                    <strong>About completion time</strong>
                    <p>
                      Completion time adds context. Faster completion does not
                      necessarily indicate greater ability, and unusually short or long
                      times do not prove whether a test was completed independently.
                    </p>
                  </aside>
                </>
              )}
            </section>

            <section className={styles.section} aria-labelledby="results-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionLabel}>Anonymous records</p>
                  <h2 id="results-title">Results Table</h2>
                </div>
                <label className={styles.sortControl}>
                  <span>Sort by</span>
                  <select
                    value={sort}
                    onChange={(event) => updateSort(event.target.value as PublicAttemptSort)}
                  >
                    <option value="recent">Most recent</option>
                    <option value="highest">Highest IQ</option>
                    <option value="lowest">Lowest IQ</option>
                    <option value="fastest">Fastest completion</option>
                    <option value="slowest">Slowest completion</option>
                  </select>
                </label>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>IQ</th>
                      <th>Correct</th>
                      <th>Completion Time</th>
                      <th>Speed Percentile</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((attempt, index) => (
                      <tr key={`${attempt.completedAt}-${attempt.iqScore}-${index}`}>
                        <td>{attempt.iqScore}</td>
                        <td>{attempt.correctCount} / 25</td>
                        <td>{formatTime(attempt.completionTimeSeconds)}</td>
                        <td>
                          {attempt.completionTimeSeconds === null
                            ? "—"
                            : attempt.speedPercentile === null
                              ? "Early sample"
                              : `Faster than ${attempt.speedPercentile}%`}
                        </td>
                        <td>{formatDate(attempt.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <button
                  type="button"
                  disabled={data.pagination.page <= 1 || status === "loading"}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ← Previous
                </button>
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={
                    data.pagination.page >= data.pagination.totalPages ||
                    status === "loading"
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(data.pagination.totalPages, current + 1),
                    )
                  }
                >
                  Next →
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
