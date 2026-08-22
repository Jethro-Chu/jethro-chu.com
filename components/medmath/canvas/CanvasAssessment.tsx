"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  QuestionClientView,
  SolutionStep,
} from "@/lib/medmath/types";
import { isCanvasCompetencyPass } from "@/lib/medmath/canvas";
import styles from "./CanvasAssessment.module.css";

const CANVAS_CATEGORIES = [
  "conversions",
  "basic-dosage",
  "iv-pump",
  "gravity-drips",
  "infusion-time",
  "insulin",
  "reconstitution",
] as const;

type AssessmentMode = "competency" | "practice";
type Stage = "assessment" | "results" | "review";

interface FeedbackRecord {
  answer: string;
  isCorrect: boolean;
  correctAnswer: number;
  answerUnit: string;
  answerPrecision: number;
  solutionSteps: SolutionStep[];
}

interface SavedAssessment {
  sessionId: string;
  questions: QuestionClientView[];
  answers: Record<string, string>;
  feedback: Record<string, FeedbackRecord>;
  currentIndex: number;
  stage: Stage;
}

interface AttemptResponse {
  isCorrect: boolean;
  correctAnswer?: number;
  answerUnit?: string;
  answerPrecision?: number;
  solutionSteps?: SolutionStep[];
  error?: string;
}

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `canvas-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function percentage(correct: number) {
  const value = (correct / 30) * 100;
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function answerText(value: number, precision: number) {
  if (precision === 0) return value.toFixed(0);
  return value.toFixed(precision).replace(/\.0+$/, "");
}

function buildBreakdown(
  questions: QuestionClientView[],
  feedback: Record<string, FeedbackRecord>,
  key: "category" | "difficulty",
) {
  const breakdown: Record<
    string,
    {
      totalQuestions: number;
      firstAttemptCorrect: number;
      eventualCorrect: number;
      totalAttempts: number;
      averageResponseTimeSeconds: number;
    }
  > = {};

  for (const question of questions) {
    const group = question[key];
    const isCorrect = feedback[question.instanceId]?.isCorrect ?? false;
    const current = breakdown[group] ?? {
      totalQuestions: 0,
      firstAttemptCorrect: 0,
      eventualCorrect: 0,
      totalAttempts: 0,
      averageResponseTimeSeconds: 0,
    };
    current.totalQuestions += 1;
    current.totalAttempts += 1;
    if (isCorrect) {
      current.firstAttemptCorrect += 1;
      current.eventualCorrect += 1;
    }
    breakdown[group] = current;
  }

  return breakdown;
}

export function CanvasAssessment({ mode }: { mode: AssessmentMode }) {
  const storageKey = `medmath-canvas-${mode}-v1`;
  const [questions, setQuestions] = useState<QuestionClientView[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, FeedbackRecord>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [stage, setStage] = useState<Stage>("assessment");
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionStartRef = useRef(Date.now());
  const initializingRef = useRef(false);
  const cancelConfirmationRef = useRef<HTMLButtonElement>(null);

  const startNewAssessment = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const questionResponse = await fetch("/api/medmath/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasExam: true }),
      });
      const questionData = (await questionResponse.json()) as {
        questions?: QuestionClientView[];
        error?: string;
      };

      if (!questionResponse.ok || questionData.questions?.length !== 30) {
        throw new Error(
          questionData.error ?? "The 30-question assessment could not be created.",
        );
      }

      const nextSessionId = generateSessionId();
      const sessionResponse = await fetch("/api/medmath/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: nextSessionId,
          visitorId: "anon",
          sessionType: mode === "competency" ? "exam" : "practice",
          selectedCategories: CANVAS_CATEGORIES,
          selectedDifficulty: "mixed",
          plannedQuestionCount: 30,
          completedQuestionCount: 0,
          startedAt: new Date().toISOString(),
          isCompleted: false,
          totalAttempts: 0,
          firstAttemptCorrectCount: 0,
          eventualCorrectCount: 0,
          totalHintsUsed: 0,
          totalSolutionsRevealed: 0,
          averageResponseTimeSeconds: 0,
          categoryBreakdown: {},
          difficultyBreakdown: {},
          weakCategories: [],
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("The assessment session could not be started.");
      }

      localStorage.removeItem(storageKey);
      setQuestions(questionData.questions);
      setSessionId(nextSessionId);
      setAnswers({});
      setFeedback({});
      setCurrentIndex(0);
      setStage("assessment");
      questionStartRef.current = Date.now();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The assessment could not be started. Please try again.",
      );
    } finally {
      initializingRef.current = false;
      setIsSubmitting(false);
      setHydrated(true);
    }
  };

  useEffect(() => {
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue) {
      try {
        const saved = JSON.parse(savedValue) as SavedAssessment;
        if (saved.questions.length === 30 && saved.sessionId) {
          setQuestions(saved.questions);
          setSessionId(saved.sessionId);
          setAnswers(saved.answers ?? {});
          setFeedback(saved.feedback ?? {});
          setCurrentIndex(Math.min(Math.max(saved.currentIndex ?? 0, 0), 29));
          setStage(saved.stage ?? "assessment");
          setHydrated(true);
          return;
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    void startNewAssessment();
    // Each route has a stable mode and storage key for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || questions.length !== 30 || !sessionId) return;
    const saved: SavedAssessment = {
      sessionId,
      questions,
      answers,
      feedback,
      currentIndex,
      stage,
    };
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [answers, currentIndex, feedback, hydrated, questions, sessionId, stage, storageKey]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIndex]);

  useEffect(() => {
    if (!showConfirmation) return;
    cancelConfirmationRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowConfirmation(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmation]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () =>
      questions.filter((question) => answers[question.instanceId]?.trim()).length,
    [answers, questions],
  );
  const correctCount = useMemo(
    () => Object.values(feedback).filter((item) => item.isCorrect).length,
    [feedback],
  );
  const incorrectCount = Object.keys(feedback).length - correctCount;
  const unansweredCount = 30 - answeredCount;

  const gradeQuestion = async (
    question: QuestionClientView,
    answer: string,
  ): Promise<FeedbackRecord> => {
    const response = await fetch("/api/medmath/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceId: question.instanceId,
        sessionId,
        attemptNumber: 1,
        submittedAnswer: answer.trim(),
        responseTimeSeconds: Math.max(
          1,
          Math.round((Date.now() - questionStartRef.current) / 1000),
        ),
        hintsUsedCount: 0,
        solutionRevealed: true,
      }),
    });
    const result = (await response.json()) as AttemptResponse;

    if (
      !response.ok ||
      typeof result.correctAnswer !== "number" ||
      !result.answerUnit ||
      typeof result.answerPrecision !== "number" ||
      !result.solutionSteps?.length
    ) {
      throw new Error(result.error ?? "This answer could not be graded.");
    }

    return {
      answer: answer.trim(),
      isCorrect: Boolean(result.isCorrect),
      correctAnswer: result.correctAnswer,
      answerUnit: result.answerUnit,
      answerPrecision: result.answerPrecision,
      solutionSteps: result.solutionSteps,
    };
  };

  const completeSession = async (
    nextFeedback: Record<string, FeedbackRecord>,
    sessionType: "exam" | "practice",
  ) => {
    const totalCorrect = Object.values(nextFeedback).filter(
      (item) => item.isCorrect,
    ).length;
    const examReview =
      sessionType === "exam"
        ? questions.map((question) => {
            const result = nextFeedback[question.instanceId];
            return {
              ...question,
              studentAnswer: result.answer,
              correctAnswer: result.correctAnswer,
              isCorrect: result.isCorrect,
              solutionSteps: result.solutionSteps,
            };
          })
        : undefined;

    const response = await fetch("/api/medmath/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        sessionType,
        examMode: sessionType === "exam" ? "custom" : undefined,
        selectedCategories: CANVAS_CATEGORIES,
        selectedDifficulty: "mixed",
        plannedQuestionCount: 30,
        completedQuestionCount: 30,
        totalAttempts: 30,
        firstAttemptCorrectCount: totalCorrect,
        eventualCorrectCount: totalCorrect,
        totalHintsUsed: 0,
        totalSolutionsRevealed: 30,
        averageResponseTimeSeconds: 0,
        categoryBreakdown: buildBreakdown(questions, nextFeedback, "category"),
        difficultyBreakdown: buildBreakdown(
          questions,
          nextFeedback,
          "difficulty",
        ),
        examReview,
      }),
    });

    if (!response.ok) {
      throw new Error("The completed assessment could not be saved.");
    }
  };

  const submitCompetency = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const records = await Promise.all(
        questions.map(async (question) => [
          question.instanceId,
          await gradeQuestion(question, answers[question.instanceId] ?? ""),
        ] as const),
      );
      const nextFeedback = Object.fromEntries(records);
      await completeSession(nextFeedback, "exam");
      setFeedback(nextFeedback);
      setStage("results");
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The exam could not be submitted. Your answers are still saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPracticeAnswer = async () => {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.instanceId]?.trim() ?? "";
    if (!answer) {
      setError("Enter a numeric answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await gradeQuestion(currentQuestion, answer);
      setFeedback((previous) => ({
        ...previous,
        [currentQuestion.instanceId]: result,
      }));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The answer could not be graded.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishPractice = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await completeSession(feedback, "practice");
      setStage("results");
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The practice results could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAssessment = () => {
    localStorage.removeItem(storageKey);
    setHydrated(false);
    void startNewAssessment();
  };

  if (!hydrated || questions.length !== 30 || !currentQuestion) {
    return (
      <div className={styles.loadingPanel} role="status">
        <p className={styles.eyebrow}>Med Math</p>
        <h1>Preparing your 30-question assessment</h1>
        <p>Questions are being selected from the regular nursing math bank.</p>
        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
            <button type="button" onClick={() => void startNewAssessment()}>
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (stage === "results") {
    const isPass = mode === "competency" && isCanvasCompetencyPass(correctCount);
    return (
      <div className={styles.resultsPage}>
        <p className={styles.eyebrow}>
          {mode === "competency" ? "Quiz Results" : "Practice Complete"}
        </p>
        <h1>
          {mode === "competency"
            ? isPass
              ? "PASS"
              : "FAIL"
            : "Practice Complete"}
        </h1>

        <div
          className={`${styles.resultBanner} ${
            mode === "competency"
              ? isPass
                ? styles.passBanner
                : styles.failBanner
              : styles.practiceBanner
          }`}
        >
          <div>
            <span>Attempt Score</span>
            <strong>{correctCount} / 30</strong>
          </div>
          <div>
            <span>Percentage</span>
            <strong>{percentage(correctCount)}</strong>
          </div>
          <div>
            <span>{mode === "competency" ? "Result" : "Incorrect"}</span>
            <strong>
              {mode === "competency" ? (isPass ? "PASS" : "FAIL") : incorrectCount}
            </strong>
          </div>
        </div>

        {mode === "competency" ? (
          <div className={styles.resultCopy}>
            <p>This assessment requires a score of 100% to pass.</p>
            <p>
              {isPass
                ? "Congratulations. You passed the Med Math Competency Exam."
                : "A score of 100% is required to pass this exam."}
            </p>
          </div>
        ) : (
          <p className={styles.resultCopy}>
            {correctCount} correct · {incorrectCount} incorrect
          </p>
        )}

        <div className={styles.resultActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setStage("review")}
          >
            {mode === "competency" ? "Review Questions" : "Review Missed Questions"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetAssessment}
            disabled={isSubmitting}
          >
            {mode === "competency" ? "Retake Exam" : "Start Another Practice Exam"}
          </button>
          <Link className={styles.textLink} href="/medmath/canvas">
            Return to testing modes
          </Link>
        </div>
      </div>
    );
  }

  if (stage === "review") {
    const reviewQuestions =
      mode === "competency"
        ? questions
        : questions.filter((question) => !feedback[question.instanceId]?.isCorrect);

    return (
      <div className={styles.reviewPage}>
        <div className={styles.reviewHeader}>
          <div>
            <p className={styles.eyebrow}>
              {mode === "competency" ? "Question Review" : "Missed Questions"}
            </p>
            <h1>
              {reviewQuestions.length === 0
                ? "No missed questions"
                : `${reviewQuestions.length} question${reviewQuestions.length === 1 ? "" : "s"}`}
            </h1>
          </div>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setStage("results")}
          >
            Back to Results
          </button>
        </div>

        {reviewQuestions.length === 0 ? (
          <div className={styles.emptyReview}>
            Every practice answer was correct. No remediation is needed.
          </div>
        ) : (
          <div className={styles.reviewList}>
            {reviewQuestions.map((question) => {
              const result = feedback[question.instanceId];
              const questionNumber = questions.indexOf(question) + 1;
              return (
                <article className={styles.reviewCard} key={question.instanceId}>
                  <header>
                    <span>Question {questionNumber}</span>
                    <strong className={result.isCorrect ? styles.correctText : styles.incorrectText}>
                      {result.isCorrect ? "Correct" : "Incorrect"}
                    </strong>
                  </header>
                  <QuestionStem question={question} />
                  <dl className={styles.answerReview}>
                    <div>
                      <dt>Your answer</dt>
                      <dd>{result.answer || "No answer"}</dd>
                    </div>
                    <div>
                      <dt>Correct answer</dt>
                      <dd>
                        {answerText(result.correctAnswer, result.answerPrecision)}{" "}
                        {result.answerUnit}
                      </dd>
                    </div>
                  </dl>
                  <Solution steps={result.solutionSteps} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const currentFeedback = feedback[currentQuestion.instanceId];
  const practiceCompletedCount = Object.keys(feedback).length;

  return (
    <div className={styles.assessmentPage}>
      <header className={styles.assessmentHeader}>
        <div>
          <p className={styles.eyebrow}>Quiz Instructions</p>
          <h1>
            {mode === "competency"
              ? "Med Math Competency Exam"
              : "Med Math Practice Exam"}
          </h1>
        </div>
        <div className={styles.headerFacts} aria-label="Assessment information">
          <span>30 Questions</span>
          <span>
            {mode === "competency"
              ? "Passing Score: 100%"
              : "Immediate Feedback Enabled"}
          </span>
          <strong>Question {currentIndex + 1} of 30</strong>
          {mode === "practice" && (
            <span>{correctCount} Correct · {incorrectCount} Incorrect</span>
          )}
        </div>
      </header>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

      <MobileNavigation
        mode={mode}
        questions={questions}
        answers={answers}
        feedback={feedback}
        currentIndex={currentIndex}
        onSelect={setCurrentIndex}
      />

      <div className={styles.assessmentGrid}>
        <main className={styles.questionColumn}>
          <article className={styles.questionCard}>
            <header className={styles.questionCardHeader}>
              <strong>Question {currentIndex + 1}</strong>
              <span>1 pts</span>
            </header>
            <div className={styles.questionBody}>
              <QuestionStem question={currentQuestion} />
              <div className={styles.answerBlock}>
                <label htmlFor={`answer-${currentQuestion.instanceId}`}>
                  Enter your answer below.
                </label>
                <div className={styles.inputRow}>
                  <input
                    id={`answer-${currentQuestion.instanceId}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={answers[currentQuestion.instanceId] ?? ""}
                    disabled={mode === "practice" && Boolean(currentFeedback)}
                    onChange={(event) => {
                      setError(null);
                      setAnswers((previous) => ({
                        ...previous,
                        [currentQuestion.instanceId]: event.target.value,
                      }));
                    }}
                    aria-describedby={`unit-${currentQuestion.instanceId}`}
                  />
                  <span id={`unit-${currentQuestion.instanceId}`}>
                    {currentQuestion.answerUnit}
                  </span>
                </div>
                {currentQuestion.roundingInstruction && (
                  <p className={styles.roundingRule}>
                    {currentQuestion.roundingInstruction}
                  </p>
                )}
              </div>

              {mode === "practice" && !currentFeedback && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void submitPracticeAnswer()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting Answer" : "Submit Answer"}
                </button>
              )}

              {mode === "practice" && currentFeedback && (
                <div
                  className={`${styles.feedbackPanel} ${
                    currentFeedback.isCorrect
                      ? styles.correctPanel
                      : styles.incorrectPanel
                  }`}
                  aria-live="polite"
                >
                  <h2>{currentFeedback.isCorrect ? "Correct" : "Incorrect"}</h2>
                  {!currentFeedback.isCorrect && (
                    <p>
                      Correct answer: {answerText(
                        currentFeedback.correctAnswer,
                        currentFeedback.answerPrecision,
                      )}{" "}
                      {currentFeedback.answerUnit}
                    </p>
                  )}
                  <Solution steps={currentFeedback.solutionSteps} />
                </div>
              )}
            </div>
          </article>

          <div className={styles.questionActions}>
            {mode === "competency" ? (
              <>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                {currentIndex < 29 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setCurrentIndex((value) => Math.min(29, value + 1))}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.submitQuizButton}
                    onClick={() => setShowConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    Submit Quiz
                  </button>
                )}
              </>
            ) : currentFeedback ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  if (practiceCompletedCount === 30) {
                    void finishPractice();
                  } else {
                    setCurrentIndex((value) => Math.min(29, value + 1));
                  }
                }}
                disabled={isSubmitting}
              >
                {practiceCompletedCount === 30 ? "Complete Practice" : "Next Question"}
              </button>
            ) : null}
          </div>

          {mode === "competency" && currentIndex < 29 && (
            <button
              type="button"
              className={styles.submitQuizLink}
              onClick={() => setShowConfirmation(true)}
              disabled={isSubmitting}
            >
              Submit Quiz
            </button>
          )}
        </main>

        <aside className={styles.desktopNavigation} aria-label="Quiz Navigation">
          <h2>Quiz Navigation</h2>
          <QuestionNavigation
            mode={mode}
            questions={questions}
            answers={answers}
            feedback={feedback}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
          <div className={styles.navigationLegend}>
            <span><i className={styles.legendCurrent} />Current</span>
            <span><i className={styles.legendAnswered} />Answered</span>
            <span><i className={styles.legendUnanswered} />Unanswered</span>
          </div>
          {mode === "competency" && (
            <p>{answeredCount} of 30 answered</p>
          )}
        </aside>
      </div>

      {showConfirmation && (
        <div className={styles.modalBackdrop}>
          <div
            className={styles.confirmationDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <h2 id="confirmation-title">Are you sure you want to submit this quiz?</h2>
            <p>
              {unansweredCount > 0
                ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Unanswered responses will be scored as incorrect.`
                : "All 30 questions have an answer."}
            </p>
            <div className={styles.dialogActions}>
              <button
                ref={cancelConfirmationRef}
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowConfirmation(false)}
              >
                Return to Quiz
              </button>
              <button
                type="button"
                className={styles.submitQuizButton}
                onClick={() => void submitCompetency()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting Quiz" : "Submit Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionNavigation({
  mode,
  questions,
  answers,
  feedback,
  currentIndex,
  onSelect,
}: {
  mode: AssessmentMode;
  questions: QuestionClientView[];
  answers: Record<string, string>;
  feedback: Record<string, FeedbackRecord>;
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className={styles.questionNavigation}>
      {questions.map((question, index) => {
        const isCurrent = index === currentIndex;
        const isAnswered =
          mode === "competency"
            ? Boolean(answers[question.instanceId]?.trim())
            : Boolean(feedback[question.instanceId]);
        const isAvailable =
          mode === "competency" || isAnswered || isCurrent;
        return (
          <button
            key={question.instanceId}
            type="button"
            aria-label={`Question ${index + 1}${isAnswered ? ", answered" : ", unanswered"}`}
            aria-current={isCurrent ? "step" : undefined}
            className={`${isCurrent ? styles.navCurrent : ""} ${
              isAnswered && !isCurrent ? styles.navAnswered : ""
            }`}
            onClick={() => onSelect(index)}
            disabled={!isAvailable}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

function MobileNavigation(props: Parameters<typeof QuestionNavigation>[0]) {
  return (
    <details className={styles.mobileNavigation}>
      <summary>Quiz Navigation</summary>
      <QuestionNavigation {...props} />
    </details>
  );
}

function QuestionStem({ question }: { question: QuestionClientView }) {
  return (
    <div className={styles.questionStem}>
      <p>{question.scenario}</p>
      {question.orderText && (
        <div className={styles.clinicalLine}>
          <span>Order</span>
          <strong>{question.orderText}</strong>
        </div>
      )}
      {question.availableText && (
        <div className={styles.clinicalLine}>
          <span>Available</span>
          <strong>{question.availableText}</strong>
        </div>
      )}
      {(question.patientWeightKg !== undefined ||
        question.patientWeightLb !== undefined) && (
        <div className={styles.clinicalLine}>
          <span>Adult weight</span>
          <strong>
            {question.patientWeightKg !== undefined
              ? `${question.patientWeightKg} kg`
              : `${question.patientWeightLb} lb`}
          </strong>
        </div>
      )}
      <h2>{question.prompt}</h2>
    </div>
  );
}

function Solution({ steps }: { steps: SolutionStep[] }) {
  return (
    <div className={styles.solution}>
      {steps.map((step) => (
        <div key={step.stepNumber}>
          <h3>{step.title}</h3>
          {step.formula && <p className={styles.formula}>{step.formula}</p>}
          <p className={styles.calculation}>{step.calculation}</p>
          {step.explanation && <p>{step.explanation}</p>}
          {step.result && <p className={styles.solutionResult}>{step.result}</p>}
        </div>
      ))}
    </div>
  );
}
