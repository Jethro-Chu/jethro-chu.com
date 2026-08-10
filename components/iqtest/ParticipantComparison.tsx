import type { ParticipantComparison as ParticipantComparisonData } from "@/lib/iqtest/results";
import styles from "./IQTest.module.css";

interface ParticipantComparisonProps {
  comparison: ParticipantComparisonData | null;
  score: number;
  status: "idle" | "loading" | "ready" | "unavailable";
}

export function ParticipantComparison({
  comparison,
  score,
  status,
}: ParticipantComparisonProps) {
  const maximumCount = Math.max(
    1,
    ...(comparison?.scoreDistribution.map((bin) => bin.count) ?? []),
  );

  return (
    <section className={styles.comparison} aria-labelledby="comparison-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.sectionLabel}>Participant telemetry</p>
          <h2 id="comparison-title">How you compare</h2>
        </div>
        {comparison && (
          <p className={styles.bestResult}>
            {comparison.participantCount.toLocaleString()} anonymous completed {comparison.participantCount === 1 ? "attempt" : "attempts"}
          </p>
        )}
      </div>

      {(status === "idle" || status === "loading") && (
        <p className={styles.comparisonStatus} role="status">
          Adding your result to the participant comparison…
        </p>
      )}

      {status === "unavailable" && (
        <p className={styles.comparisonStatus} role="status">
          Your result is safe in this browser. The participant comparison is temporarily unavailable.
        </p>
      )}

      {status === "ready" && comparison && (
        <>
          <div className={styles.comparisonSummary}>
            <p>
              <span>Participant median</span>
              <strong>{comparison.medianScore}</strong>
            </p>
            <p>
              <span>Your IQ score</span>
              <strong>{score}</strong>
            </p>
            <p>
              <span>{comparison.higherThanPercent === null ? "Sample status" : "Relative result"}</span>
              <strong className={styles.comparisonPhrase}>
                {comparison.higherThanPercent === null
                  ? "Early sample"
                  : `Higher than ${comparison.higherThanPercent}%`}
              </strong>
            </p>
          </div>

          <figure className={styles.distributionFigure}>
            <div
              className={styles.distributionChart}
              role="img"
              aria-label={`Distribution of ${comparison.participantCount} participant IQ scores. Your IQ score is ${score}.`}
            >
              {comparison.scoreDistribution.map((bin) => {
                const isUserBin = score >= bin.minimum && score <= bin.maximum;
                const height = bin.count === 0 ? 0 : Math.max(5, (bin.count / maximumCount) * 100);
                return (
                  <div
                    className={`${styles.distributionColumn} ${isUserBin ? styles.distributionColumnActive : ""}`}
                    key={bin.label}
                  >
                    <div className={styles.barValue}>{bin.count || ""}</div>
                    <div className={styles.barWell} aria-hidden="true">
                      <span style={{ height: `${height}%` }} />
                    </div>
                    <span className={styles.binLabel}>{bin.label}</span>
                    {isUserBin && <span className={styles.youMarker}>You</span>}
                  </div>
                );
              })}
            </div>
            <figcaption>
              Recorded IQ score distribution. No names, emails, or account details are collected.
            </figcaption>
          </figure>

          {comparison.higherThanPercent === null && (
            <p className={styles.earlySampleNote}>
              Percentile comparison appears after five completed attempts.
            </p>
          )}
        </>
      )}
    </section>
  );
}
