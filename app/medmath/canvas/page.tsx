import Link from "next/link";
import styles from "@/components/medmath/canvas/CanvasAssessment.module.css";

export default function MedMathCanvasPage() {
  return (
    <div className={styles.canvasPage}>
      <header className={styles.landingHeader}>
        <p className={styles.eyebrow}>Med Math</p>
        <h1>Dosage Calculation Competency</h1>
        <p>
          Choose a testing mode below. Each exam contains 30 nursing
          medication-math questions.
        </p>
      </header>

      <div className={styles.optionList}>
        <section className={styles.optionRow} aria-labelledby="competency-title">
          <div>
            <p className={styles.optionNumber}>Test 1</p>
            <h2 id="competency-title">Med Math Competency Exam</h2>
            <p className={styles.optionMeta}>30 Questions · 100% Required to Pass</p>
            <p className={styles.optionDescription}>
              No feedback is shown until the complete exam is submitted.
            </p>
          </div>
          <Link className={styles.primaryButton} href="/medmath/canvas/test">
            Start Test
          </Link>
        </section>

        <section className={styles.optionRow} aria-labelledby="practice-title">
          <div>
            <p className={styles.optionNumber}>Test 2</p>
            <h2 id="practice-title">Med Math Practice Exam</h2>
            <p className={styles.optionMeta}>30 Questions · Immediate Feedback</p>
            <p className={styles.optionDescription}>
              Submit each response to see the calculation and explanation.
            </p>
          </div>
          <Link className={styles.secondaryButton} href="/medmath/canvas/practice">
            Start Practice
          </Link>
        </section>
      </div>

      <p className={styles.landingNote}>
        Regular adult nursing medication math only. No ICU, pediatric, or
        titratable infusion concepts.
      </p>
    </div>
  );
}
