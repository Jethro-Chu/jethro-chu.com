"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  categoryLabels,
  iqQuestions,
  stableQuestionId,
  type IQOption,
  type IQQuestion,
  type QuestionCategory,
} from "@/lib/iqtest/questions";
import {
  generateBalancedTest,
  RANDOMIZED_TEST_VERSION,
  shuffled,
  TEST_QUESTION_COUNT,
} from "@/lib/iqtest/randomizer";
import {
  performanceLabel,
  scoreAttempt,
  type ScoredAttempt,
} from "@/lib/iqtest/scoring";
import { trackIQEvent } from "@/lib/iqtest/analytics";
import type {
  CompletionTiming,
  IQResultResponse,
  ParticipantComparison as ParticipantComparisonData,
  TimingAnalytics as TimingAnalyticsData,
} from "@/lib/iqtest/results";
import { ParticipantComparison } from "./ParticipantComparison";
import { QuestionDiagram } from "./QuestionDiagram";
import { TimingAnalytics } from "./TimingAnalytics";
import styles from "./IQTest.module.css";

type Phase = "start" | "test" | "results";
type ReviewFilter = "all" | "correct" | "incorrect";
type AnswerMap = Record<number, string>;

interface AttemptQuestion extends IQQuestion {
  displayOptions: IQOption[];
}

interface SavedAttempt {
  testVersion?: number;
  selectedQuestionIds?: string[];
  completedAt: string;
  score: number;
  correctCount: number;
  completionSeconds: number;
  weightedPerformance: number;
  questionResults: Array<{ id: number; correct: boolean }>;
}

interface PersistedCompletedAttempt {
  version: 2 | 3 | 4 | 5;
  testVersion?: number;
  attemptId?: string;
  attempt: AttemptQuestion[];
  answers: AnswerMap;
  completionSeconds: number;
  result: ScoredAttempt;
  comparison?: ParticipantComparisonData;
  timing?: CompletionTiming;
  timingAnalytics?: TimingAnalyticsData;
}

const CATEGORY_ORDER: QuestionCategory[] = [
  "probability",
  "logic",
  "patterns",
  "quantitative",
  "spatial",
];

const OPTION_LETTERS = ["A", "B", "C", "D"];
const STORAGE_BEST = "jethro-iq-best-v2";
const STORAGE_HISTORY = "jethro-iq-history-v2";
const SESSION_COMPLETED = "jethro-iq-completed-v2";

function buildAttempt(): AttemptQuestion[] {
  return generateBalancedTest(iqQuestions).map((question) => ({
    ...question,
    displayOptions: shuffled(question.options),
  }));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function saveAttempt(
  result: ScoredAttempt,
  answers: AnswerMap,
  completionSeconds: number,
  questions: AttemptQuestion[],
  testVersion: number,
) {
  try {
    const stored = window.localStorage.getItem(STORAGE_HISTORY);
    const history = stored ? (JSON.parse(stored) as SavedAttempt[]) : [];
    const attempt: SavedAttempt = {
      testVersion,
      selectedQuestionIds: questions.map((question) => question.stableId),
      completedAt: new Date().toISOString(),
      score: result.iqScore,
      correctCount: result.correctCount,
      completionSeconds,
      weightedPerformance: result.weightedPerformance,
      questionResults: questions.map((question) => ({
        id: question.id,
        correct: answers[question.id] === question.correctAnswer,
      })),
    };
    window.localStorage.setItem(
      STORAGE_HISTORY,
      JSON.stringify([attempt, ...history].slice(0, 10)),
    );
  } catch {
    // Storage can be disabled. The test remains fully functional without it.
  }
}

function persistCompletedAttempt(completed: PersistedCompletedAttempt) {
  try {
    window.sessionStorage.setItem(SESSION_COMPLETED, JSON.stringify(completed));
  } catch {
    // Session persistence is optional.
  }
}

export function IQTest() {
  const [phase, setPhase] = useState<Phase>("start");
  const [showTimer, setShowTimer] = useState(true);
  const [attempt, setAttempt] = useState<AttemptQuestion[]>([]);
  const [attemptTestVersion, setAttemptTestVersion] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completionSeconds, setCompletionSeconds] = useState(0);
  const [result, setResult] = useState<ScoredAttempt | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [comparison, setComparison] = useState<ParticipantComparisonData | null>(null);
  const [timing, setTiming] = useState<CompletionTiming | null>(null);
  const [timingAnalytics, setTimingAnalytics] =
    useState<TimingAnalyticsData | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const submissionLocked = useRef(false);
  const warningCancelButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_BEST);
      if (stored) setBestScore(Number(stored));
      const completed = window.sessionStorage.getItem(SESSION_COMPLETED);
      if (completed) {
        const parsed = JSON.parse(completed) as PersistedCompletedAttempt;
        if (
          (parsed.version === 2 ||
            parsed.version === 3 ||
            parsed.version === 4 ||
            parsed.version === 5) &&
          parsed.attempt?.length === TEST_QUESTION_COUNT &&
          parsed.answers &&
          typeof parsed.answers === "object" &&
          Number.isFinite(parsed.completionSeconds) &&
          parsed.result?.iqScore >= 32 &&
          parsed.result.iqScore <= 129
        ) {
          setAttempt(
            parsed.attempt.map((question) => ({
              ...question,
              stableId: question.stableId ?? stableQuestionId(question.id),
            })),
          );
          setAttemptTestVersion(parsed.testVersion ?? 1);
          setAnswers(parsed.answers);
          setCompletionSeconds(parsed.completionSeconds);
          setResult(parsed.result);
          setAttemptId(parsed.attemptId ?? window.crypto.randomUUID());
          setComparison(parsed.comparison ?? null);
          setTiming(parsed.timing ?? null);
          setTimingAnalytics(parsed.timingAnalytics ?? null);
          setComparisonStatus(parsed.comparison ? "ready" : "idle");
          setPhase("results");
        }
      }
    } catch {
      // Local persistence is optional.
    }
  }, []);

  useEffect(() => {
    if (phase !== "test" || startedAt.current === null) return;
    const updateTimer = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000),
      );
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (showSubmitWarning) warningCancelButton.current?.focus();
  }, [showSubmitWarning]);

  const beginAttempt = useCallback(
    (isRetake = false) => {
      setAttempt(buildAttempt());
      setAttemptTestVersion(RANDOMIZED_TEST_VERSION);
      setAnswers({});
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setCompletionSeconds(0);
      setResult(null);
      setAttemptId(window.crypto.randomUUID());
      setComparison(null);
      setTiming(null);
      setTimingAnalytics(null);
      setComparisonStatus("idle");
      setReviewOpen(false);
      setReviewFilter("all");
      setCopyStatus(null);
      submissionLocked.current = false;
      try {
        window.sessionStorage.removeItem(SESSION_COMPLETED);
      } catch {
        // Session persistence is optional.
      }
      startedAt.current = Date.now();
      setPhase("test");
      trackIQEvent(isRetake ? "iq_test_retake" : "iq_test_started", {
        timer_visible: showTimer,
        test_version: RANDOMIZED_TEST_VERSION,
      });
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [showTimer],
  );

  const chooseAnswer = useCallback(
    (optionId: string) => {
      const question = attempt[currentIndex];
      if (!question) return;
      setAnswers((current) => ({ ...current, [question.id]: optionId }));
      trackIQEvent("iq_question_answered", {
        question_id: question.stableId,
        displayed_position: currentIndex + 1,
        correct: optionId === question.correctAnswer,
      });
    },
    [attempt, currentIndex],
  );

  const moveTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= attempt.length) return;
      setCurrentIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [attempt.length],
  );

  const finishAttempt = useCallback(() => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    const completedAtMs = Date.now();
    const startedAtMs = startedAt.current ?? completedAtMs - elapsedSeconds * 1000;
    const finalSeconds = startedAt.current
      ? Math.floor((completedAtMs - startedAt.current) / 1000)
      : elapsedSeconds;
    const completedTiming: CompletionTiming = {
      timingVersion: 1,
      startedAt: new Date(startedAtMs).toISOString(),
      completedAt: new Date(completedAtMs).toISOString(),
      completionTimeSeconds: finalSeconds,
    };
    const scored = scoreAttempt(attempt, answers);
    const completedAttemptId = attemptId || window.crypto.randomUUID();
    if (!attemptId) setAttemptId(completedAttemptId);
    setCompletionSeconds(finalSeconds);
    setTiming(completedTiming);
    setResult(scored);
    setPhase("results");
    setShowSubmitWarning(false);
    startedAt.current = null;
    saveAttempt(
      scored,
      answers,
      finalSeconds,
      attempt,
      attemptTestVersion,
    );
    persistCompletedAttempt({
      version: 5,
      testVersion: attemptTestVersion,
      attemptId: completedAttemptId,
      attempt,
      answers,
      completionSeconds: finalSeconds,
      result: scored,
      timing: completedTiming,
    });

    const nextBest = Math.max(bestScore ?? 0, scored.iqScore);
    setBestScore(nextBest);
    try {
      window.localStorage.setItem(STORAGE_BEST, String(nextBest));
    } catch {
      // Local persistence is optional.
    }

    trackIQEvent("iq_test_completed", {
      total_score: scored.iqScore,
      correct_count: scored.correctCount,
      weighted_performance: Number(scored.weightedPerformance.toFixed(4)),
      completion_time: finalSeconds,
      timing_version: completedTiming.timingVersion,
      test_version: attemptTestVersion,
      probability_accuracy: Number(scored.categoryAccuracy.probability.toFixed(4)),
      logic_accuracy: Number(scored.categoryAccuracy.logic.toFixed(4)),
      patterns_accuracy: Number(scored.categoryAccuracy.patterns.toFixed(4)),
      quantitative_accuracy: Number(scored.categoryAccuracy.quantitative.toFixed(4)),
      spatial_accuracy: Number(scored.categoryAccuracy.spatial.toFixed(4)),
    });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [
    answers,
    attempt,
    attemptId,
    attemptTestVersion,
    bestScore,
    elapsedSeconds,
  ]);

  useEffect(() => {
    if (
      phase !== "results" ||
      !result ||
      !attemptId ||
      comparisonStatus !== "idle"
    ) {
      return;
    }

    const controller = new AbortController();
    setComparisonStatus("loading");

    void fetch("/api/iqtest/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        iqScore: result.iqScore,
        answers,
        completionSeconds,
        testVersion: attemptTestVersion,
        selectedQuestionIds:
          attemptTestVersion === RANDOMIZED_TEST_VERSION
            ? attempt.map((question) => question.stableId)
            : undefined,
        timingVersion: timing?.timingVersion,
        startedAt: timing?.startedAt,
        completedAt: timing?.completedAt,
        completionTimeSeconds: timing?.completionTimeSeconds,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Result submission failed: ${response.status}`);
        return (await response.json()) as IQResultResponse;
      })
      .then((response) => {
        const verifiedResult =
          response.iqScore === result.iqScore
            ? result
            : { ...result, iqScore: response.iqScore };
        setResult(verifiedResult);
        setComparison(response.comparison);
        const verifiedTiming = response.timing ?? timing;
        setTiming(verifiedTiming);
        setTimingAnalytics(response.timingAnalytics ?? null);
        if (verifiedTiming) {
          setCompletionSeconds(verifiedTiming.completionTimeSeconds);
        }
        setComparisonStatus("ready");
        persistCompletedAttempt({
          version: 5,
          testVersion: attemptTestVersion,
          attemptId,
          attempt,
          answers,
          completionSeconds:
            verifiedTiming?.completionTimeSeconds ?? completionSeconds,
          result: verifiedResult,
          comparison: response.comparison,
          timing: verifiedTiming ?? undefined,
          timingAnalytics: response.timingAnalytics,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setComparisonStatus("unavailable");
      });

    return () => controller.abort();
  }, [
    answers,
    attempt,
    attemptId,
    attemptTestVersion,
    completionSeconds,
    phase,
    result,
    timing,
  ]);

  const requestSubmit = useCallback(() => {
    const unansweredCount = attempt.length - Object.keys(answers).length;
    if (unansweredCount > 0) setShowSubmitWarning(true);
    else finishAttempt();
  }, [answers, attempt.length, finishAttempt]);

  useEffect(() => {
    if (phase !== "test") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSubmitWarning) {
        if (event.key === "Escape") setShowSubmitWarning(false);
        return;
      }
      if (["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        const option = attempt[currentIndex]?.displayOptions[Number(event.key) - 1];
        if (option) chooseAnswer(option.id);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveTo(currentIndex - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (currentIndex === attempt.length - 1) requestSubmit();
        else moveTo(currentIndex + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    attempt,
    chooseAnswer,
    currentIndex,
    moveTo,
    phase,
    requestSubmit,
    showSubmitWarning,
  ]);

  const copyText = useCallback(async (text: string, status: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(status);
      window.setTimeout(() => setCopyStatus(null), 2200);
    } catch {
      setCopyStatus("Copy failed. Select the text and try again.");
    }
  }, []);

  const shareChallenge = useCallback(() => {
    if (!result) return;
    const text = `I got an IQ score of ${result.iqScore} on the Jethro IQ Test. Beat me: jethrochu.com/iqtest`;
    void copyText(text, "Challenge copied.");
    trackIQEvent("iq_test_shared", { method: "challenge", score: result.iqScore });
  }, [copyText, result]);

  const copyResult = useCallback(() => {
    if (!result) return;
    const text = `The Jethro IQ Test: IQ score ${result.iqScore}, ${result.correctCount}/25 correct in ${formatTime(completionSeconds)}. jethrochu.com/iqtest`;
    void copyText(text, "Result copied.");
    trackIQEvent("iq_test_shared", { method: "result", score: result.iqScore });
  }, [completionSeconds, copyText, result]);

  const jumpToReview = useCallback((questionId: number) => {
    setReviewOpen(true);
    setReviewFilter("all");
    window.setTimeout(() => {
      document.getElementById(`review-${questionId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, []);

  const currentQuestion = attempt[currentIndex];
  const unansweredCount = attempt.length - Object.keys(answers).length;
  const categoryResultsAreTied = result
    ? new Set(Object.values(result.categoryAccuracy)).size === 1
    : false;

  return (
    <main id="main" className={styles.shell}>
      <div className={styles.routeLine} aria-hidden="true" />

      {phase === "start" && (
        <section className={styles.startScreen} aria-labelledby="iq-title">
          <div className={styles.startHeader}>
            <p className={styles.kicker}>Hidden route · Reasoning assessment</p>
            <h1 id="iq-title" className={styles.title}>
              The Jethro IQ Test
            </h1>
            <p className={styles.subtitle}>25 questions. How far can you get?</p>
            <p className={styles.categories}>
              Probability <span>•</span> Logic <span>•</span> Patterns <span>•</span>{" "}
              Quantitative <span>•</span> Spatial
            </p>
          </div>

          <div className={styles.startGrid}>
            <div>
              <p className={styles.sectionLabel}>Rules</p>
              <ul className={styles.rules}>
                <li>No calculator.</li>
                <li>No Googling.</li>
                <li>No AI.</li>
                <li>No outside help.</li>
                <li>Take your best guess if you are stuck.</li>
              </ul>
              <p className={styles.guessing}>There is no penalty for guessing.</p>
            </div>

            <div className={styles.startControls}>
              <label className={styles.timerToggle}>
                <span>
                  <strong>Show timer</strong>
                  <small>Counts up. Never affects your score.</small>
                </span>
                <input
                  type="checkbox"
                  checked={showTimer}
                  onChange={(event) => setShowTimer(event.target.checked)}
                />
                <span className={styles.toggleTrack} aria-hidden="true">
                  <span />
                </span>
              </label>
              {bestScore !== null && (
                <p className={styles.previousBest}>Previous best IQ score: {bestScore}</p>
              )}
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => beginAttempt(false)}
              >
                Begin Test <span aria-hidden="true">→</span>
              </button>
              <a className={styles.dataLink} href="/iqtest/data">
                View Test Data <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

        </section>
      )}

      {phase === "test" && currentQuestion && (
        <section className={styles.testScreen} aria-label="IQ test">
          <header className={styles.testHeader}>
            <div className={styles.testMeta}>
              <p>
                Question <strong>{currentIndex + 1}</strong> of {attempt.length}
              </p>
              {showTimer && (
                <time className={styles.timer} aria-label={`Elapsed time ${formatTime(elapsedSeconds)}`}>
                  {formatTime(elapsedSeconds)}
                </time>
              )}
            </div>
            <div className={styles.progressTrack} aria-hidden="true">
              <span style={{ width: `${((currentIndex + 1) / attempt.length) * 100}%` }} />
            </div>
          </header>

          <div key={currentQuestion.id} className={styles.questionStage}>
            <p className={styles.categoryLabel}>{categoryLabels[currentQuestion.category]}</p>
            <h2 className={styles.questionText}>{currentQuestion.question}</h2>
            {currentQuestion.detail && (
              <p className={styles.questionDetail}>{currentQuestion.detail}</p>
            )}
            {currentQuestion.diagram && (
              <QuestionDiagram diagram={currentQuestion.diagram} />
            )}

            <div className={styles.answerList} role="radiogroup" aria-label="Answer choices">
              {currentQuestion.displayOptions.map((option, index) => {
                const selected = answers[currentQuestion.id] === option.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={option.id}
                    className={`${styles.answerButton} ${selected ? styles.answerSelected : ""}`}
                    onClick={() => chooseAnswer(option.id)}
                  >
                    <span className={styles.answerLetter}>{OPTION_LETTERS[index]}</span>
                    <span>{option.text}</span>
                    <span className={styles.answerKey}>{index + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <nav className={styles.questionNav} aria-label="Question navigation">
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => moveTo(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <span aria-hidden="true">←</span> Previous
            </button>
            {currentIndex === attempt.length - 1 ? (
              <button type="button" className={styles.primaryButton} onClick={requestSubmit}>
                Submit Test
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => moveTo(currentIndex + 1)}
              >
                Next <span aria-hidden="true">→</span>
              </button>
            )}
          </nav>

          <p className={styles.keyboardHint}>
            Keys: 1–4 answer · ← previous · Enter next
          </p>
        </section>
      )}

      {phase === "results" && result && (
        <section className={styles.resultsScreen} aria-label="IQ test results">
          <header className={`${styles.scoreHero} ${result.correctCount === 25 ? styles.perfectHero : ""}`}>
            <p className={styles.resultKicker}>Your IQ score</p>
            <h1 id="result-title" className={styles.scoreNumber}>{result.iqScore}</h1>
            <p className={styles.performanceLabel}>{performanceLabel(result.iqScore)}</p>
            <div className={styles.resultStats}>
              <span><strong>Questions Correct: {result.correctCount} / 25</strong></span>
              <span>Completed in <strong>{formatTime(completionSeconds)}</strong></span>
              <span>Average <strong>{formatTime(Math.round(completionSeconds / 25))}</strong> per question</span>
              {typeof timingAnalytics?.speedPercentile === "number" && (
                <span>
                  Speed percentile{" "}
                  <strong>
                    Faster than {timingAnalytics.speedPercentile}% of timed test takers
                  </strong>
                </span>
              )}
            </div>
            {result.correctCount === 25 && (
              <>
                <p className={styles.performanceMessage}>Okay. You win.</p>
                <p className={styles.perfectNote}>
                  I specifically designed this test so this wouldn't happen.
                </p>
              </>
            )}
          </header>

          <p className={styles.disclaimer}>
            This is an entertainment estimate and not a standardized psychological measurement.
          </p>

          <ParticipantComparison
            comparison={comparison}
            score={result.iqScore}
            status={comparisonStatus}
          />

          {timing && (
            <TimingAnalytics
              analytics={timingAnalytics}
              status={comparisonStatus}
            />
          )}

          <section className={styles.breakdown} aria-labelledby="breakdown-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionLabel}>Performance profile</p>
                <h2 id="breakdown-title">Category breakdown</h2>
              </div>
              {bestScore !== null && <p className={styles.bestResult}>Personal best IQ score: {bestScore}</p>}
            </div>
            <div className={styles.categoryBars}>
              {CATEGORY_ORDER.map((category) => {
                const accuracy = Math.round(result.categoryAccuracy[category] * 100);
                return (
                  <div className={styles.categoryRow} key={category}>
                    <div>
                      <span>{categoryLabels[category]}</span>
                      <strong>{accuracy}%</strong>
                    </div>
                    <div className={styles.categoryTrack} aria-label={`${categoryLabels[category]} ${accuracy}%`}>
                      <span style={{ width: `${accuracy}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.areaSummary}>
              <p><span>Strongest area</span>{categoryResultsAreTied ? "Even across all areas" : categoryLabels[result.strongestCategory]}</p>
              <p><span>Most challenging area</span>{categoryResultsAreTied ? "No single area" : categoryLabels[result.mostChallengingCategory]}</p>
            </div>
          </section>

          {result.missed.length > 0 && (
            <section className={styles.hardestSection} aria-labelledby="hardest-title">
              <p className={styles.sectionLabel}>Post-test telemetry</p>
              <h2 id="hardest-title">The Questions That Got You</h2>
              <div className={styles.hardestLinks}>
                {result.missed.slice(0, 3).map((question) => {
                  const position = attempt.findIndex((item) => item.id === question.id) + 1;
                  return (
                    <button type="button" key={question.id} onClick={() => jumpToReview(question.id)}>
                      <span>#{position}</span>
                      {categoryLabels[question.category]}
                      <span aria-hidden="true">↓</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className={styles.shareSection} aria-labelledby="share-title">
            <div>
              <p className={styles.sectionLabel}>Pass it on</p>
              <h2 id="share-title">Challenge a Friend</h2>
              <p>Think someone can beat an IQ score of {result.iqScore}? Send them the hidden route.</p>
            </div>
            <div className={styles.shareButtons}>
              <button type="button" className={styles.primaryButton} onClick={shareChallenge}>Challenge a Friend</button>
              <button type="button" className={styles.secondaryButton} onClick={copyResult}>Copy Result</button>
              <button type="button" className={styles.textButton} onClick={() => beginAttempt(true)}>Retake Test</button>
            </div>
            {copyStatus && <p className={styles.copyStatus} role="status">{copyStatus}</p>}
          </section>

          <section className={styles.reviewSection} aria-labelledby="review-title">
            <button
              type="button"
              className={styles.reviewToggle}
              aria-expanded={reviewOpen}
              onClick={() => setReviewOpen((open) => !open)}
            >
              <span>
                <span className={styles.sectionLabel}>Full reasoning</span>
                <strong id="review-title">Review My Answers</strong>
              </span>
              <span aria-hidden="true">{reviewOpen ? "−" : "+"}</span>
            </button>

            {reviewOpen && (
              <div className={styles.reviewBody}>
                <div className={styles.reviewFilters} aria-label="Filter answer review">
                  {(["all", "correct", "incorrect"] as ReviewFilter[]).map((filter) => (
                    <button
                      type="button"
                      key={filter}
                      aria-pressed={reviewFilter === filter}
                      onClick={() => setReviewFilter(filter)}
                    >
                      {filter[0].toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                <div className={styles.reviewList}>
                  {attempt.map((question, index) => {
                    const isCorrect = answers[question.id] === question.correctAnswer;
                    if (reviewFilter === "correct" && !isCorrect) return null;
                    if (reviewFilter === "incorrect" && isCorrect) return null;
                    const userOption = question.options.find((option) => option.id === answers[question.id]);
                    const correctOption = question.options.find((option) => option.id === question.correctAnswer);
                    return (
                      <article id={`review-${question.id}`} className={styles.reviewCard} key={question.id}>
                        <header>
                          <div>
                            <p>Question {index + 1} · {categoryLabels[question.category]}</p>
                            <div className={styles.difficulty} aria-label={`Difficulty ${question.difficulty} out of 5`}>
                              <span>Difficulty</span>
                              {Array.from({ length: 5 }, (_, dot) => (
                                <i key={dot} className={dot < question.difficulty ? styles.difficultyFilled : undefined} />
                              ))}
                            </div>
                          </div>
                          <span className={isCorrect ? styles.correctMark : styles.incorrectMark}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </header>
                        <h3>{question.question}</h3>
                        {question.detail && <p className={styles.reviewDetail}>{question.detail}</p>}
                        <dl className={styles.answerReview}>
                          <div>
                            <dt>Your answer</dt>
                            <dd>{userOption?.text ?? "Not answered"}</dd>
                          </div>
                          <div>
                            <dt>Correct answer</dt>
                            <dd>{correctOption?.text}</dd>
                          </div>
                        </dl>
                        <div className={styles.explanation}>
                          <p>Reasoning</p>
                          <p>{question.explanation}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </section>
      )}

      {showSubmitWarning && (
        <div className={styles.dialogBackdrop} role="presentation" onMouseDown={() => setShowSubmitWarning(false)}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="submit-warning-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className={styles.sectionLabel}>Before you submit</p>
            <h2 id="submit-warning-title">
              You still have {unansweredCount} unanswered {unansweredCount === 1 ? "question" : "questions"}.
            </h2>
            <p>Unanswered questions receive no points. Submit anyway?</p>
            <div>
              <button ref={warningCancelButton} type="button" className={styles.secondaryButton} onClick={() => setShowSubmitWarning(false)}>Keep Working</button>
              <button type="button" className={styles.primaryButton} onClick={finishAttempt}>Submit Anyway</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
