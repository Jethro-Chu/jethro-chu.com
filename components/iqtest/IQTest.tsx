"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  categoryLabels,
  iqQuestions,
  type IQOption,
  type IQQuestion,
  type QuestionCategory,
} from "@/lib/iqtest/questions";
import {
  performanceLabel,
  performanceMessage,
  scoreAttempt,
  type ScoredAttempt,
} from "@/lib/iqtest/scoring";
import { trackIQEvent } from "@/lib/iqtest/analytics";
import { QuestionDiagram } from "./QuestionDiagram";
import styles from "./IQTest.module.css";

type Phase = "start" | "test" | "results";
type ReviewFilter = "all" | "correct" | "incorrect";
type AnswerMap = Record<number, string>;

interface AttemptQuestion extends IQQuestion {
  displayOptions: IQOption[];
}

interface SavedAttempt {
  completedAt: string;
  score: number;
  correctCount: number;
  completionSeconds: number;
  weightedAccuracy: number;
  questionResults: Array<{ id: number; correct: boolean }>;
}

const ORDER_GROUPS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17],
  [18, 19, 20],
  [21, 22, 23, 24, 25],
] as const;

const CATEGORY_ORDER: QuestionCategory[] = [
  "probability",
  "logic",
  "patterns",
  "quantitative",
  "spatial",
];

const OPTION_LETTERS = ["A", "B", "C", "D"];
const STORAGE_BEST = "jethro-iq-best-v1";
const STORAGE_HISTORY = "jethro-iq-history-v1";

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildAttempt(): AttemptQuestion[] {
  return ORDER_GROUPS.flatMap((group) =>
    shuffled(group).map((id) => {
      const question = iqQuestions.find((item) => item.id === id);
      if (!question) throw new Error(`Missing IQ question ${id}`);
      return { ...question, displayOptions: shuffled(question.options) };
    }),
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function saveAttempt(
  result: ScoredAttempt,
  answers: AnswerMap,
  completionSeconds: number,
) {
  try {
    const stored = window.localStorage.getItem(STORAGE_HISTORY);
    const history = stored ? (JSON.parse(stored) as SavedAttempt[]) : [];
    const attempt: SavedAttempt = {
      completedAt: new Date().toISOString(),
      score: result.iqScore,
      correctCount: result.correctCount,
      completionSeconds,
      weightedAccuracy: result.weightedAccuracy,
      questionResults: iqQuestions.map((question) => ({
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

export function IQTest() {
  const [phase, setPhase] = useState<Phase>("start");
  const [showTimer, setShowTimer] = useState(true);
  const [attempt, setAttempt] = useState<AttemptQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completionSeconds, setCompletionSeconds] = useState(0);
  const [result, setResult] = useState<ScoredAttempt | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const warningCancelButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_BEST);
      if (stored) setBestScore(Number(stored));
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
      setAnswers({});
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setCompletionSeconds(0);
      setResult(null);
      setReviewOpen(false);
      setReviewFilter("all");
      setCopyStatus(null);
      startedAt.current = Date.now();
      setPhase("test");
      trackIQEvent(isRetake ? "iq_test_retake" : "iq_test_started", {
        timer_visible: showTimer,
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
        question_id: question.id,
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
    const finalSeconds = startedAt.current
      ? Math.floor((Date.now() - startedAt.current) / 1000)
      : elapsedSeconds;
    const scored = scoreAttempt(iqQuestions, answers);
    setCompletionSeconds(finalSeconds);
    setResult(scored);
    setPhase("results");
    setShowSubmitWarning(false);
    startedAt.current = null;
    saveAttempt(scored, answers, finalSeconds);

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
      weighted_accuracy: Number(scored.weightedAccuracy.toFixed(4)),
      completion_time: finalSeconds,
      probability_accuracy: Number(scored.categoryAccuracy.probability.toFixed(4)),
      logic_accuracy: Number(scored.categoryAccuracy.logic.toFixed(4)),
      patterns_accuracy: Number(scored.categoryAccuracy.patterns.toFixed(4)),
      quantitative_accuracy: Number(scored.categoryAccuracy.quantitative.toFixed(4)),
      spatial_accuracy: Number(scored.categoryAccuracy.spatial.toFixed(4)),
    });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [answers, bestScore, elapsedSeconds]);

  const requestSubmit = useCallback(() => {
    const unansweredCount = iqQuestions.length - Object.keys(answers).length;
    if (unansweredCount > 0) setShowSubmitWarning(true);
    else finishAttempt();
  }, [answers, finishAttempt]);

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
    const text = `I got a ${result.iqScore} on the Jethro IQ Test. Beat me: jethrochu.com/iqtest`;
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
  const unansweredCount = iqQuestions.length - Object.keys(answers).length;
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
              <p className={styles.estimate}>Estimated time: 20–30 minutes</p>
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
                <p className={styles.previousBest}>Previous best: {bestScore}</p>
              )}
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => beginAttempt(false)}
              >
                Begin Test <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          <p className={styles.startNote}>
            No account. No email. Your latest attempts stay in this browser.
          </p>
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
              <span><strong>{result.correctCount} / 25</strong> correct</span>
              <span>Completed in <strong>{formatTime(completionSeconds)}</strong></span>
              <span>Average <strong>{formatTime(Math.round(completionSeconds / 25))}</strong> per question</span>
            </div>
            <p className={styles.percentile}>
              Approximate IQ-style percentile: <strong>{ordinal(result.percentile)}</strong>
            </p>
            <p className={styles.performanceMessage}>{performanceMessage(result.correctCount, result.iqScore)}</p>
            {result.correctCount === 25 && (
              <p className={styles.perfectNote}>
                I specifically made this difficult so this would not happen.
              </p>
            )}
          </header>

          <p className={styles.disclaimer}>
            This is an entertainment estimate and not a standardized psychological measurement.
          </p>

          <section className={styles.breakdown} aria-labelledby="breakdown-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionLabel}>Performance profile</p>
                <h2 id="breakdown-title">Category breakdown</h2>
              </div>
              {bestScore !== null && <p className={styles.bestResult}>Personal best: {bestScore}</p>}
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
              <p>Think someone can beat {result.iqScore}? Send them the hidden route.</p>
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
