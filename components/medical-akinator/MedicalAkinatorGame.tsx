"use client";

/* ============================================================
   MEDICAL AKINATOR  ·  hidden educational easter egg
   Opened only by submitting the exact command "akinator" in the
   hero command bar. The player thinks of a medical/nursing concept;
   a Gemini-backed engine (server route /api/medical-akinator) asks
   one yes/no/maybe/unknown question at a time, then guesses.

   Self-contained and reusable: the only prop is onClose. Aesthetic
   mirrors the Ask Jethro panel — sand surface, hairline rules,
   monospace labels, pine accent, soft radii. Gemini is never called
   from the browser; this component only hits the same-origin route.

   Question mode shows PROGRESS (not confidence). Confidence is shown
   only when the engine commits to a final guess. After three wrong
   guesses the engine gives up and asks what the answer was, then
   shows a learning summary for it.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check, ArrowRight, CornerDownLeft } from "@/components/ask-jethro/icons";

interface Props {
  onClose: () => void;
}

type AnswerValue = "yes" | "no" | "maybe" | "unknown";

interface QA {
  question: string;
  answer: AnswerValue;
}

interface Summary {
  whatItIs: string;
  signsSymptoms: string;
  nursingPriorities: string;
  nclexClue: string;
}

interface ApiResponse {
  status: "question" | "guess" | "safety";
  question: string | null;
  guess: string | null;
  confidence: number;
  summary?: Summary | null;
  message?: string | null;
}

const MAX_WRONG_GUESSES = 3;

const SAFETY_FALLBACK =
  "This is an educational game, not medical advice. If this is an emergency, call your local emergency number or get medical help now.";

/* The ten categories, in the order they appear. `key` is sent to the API
   (and must match the route's allowlist); `label` is what the player sees. */
const CATEGORIES: { key: string; label: string }[] = [
  { key: "disease process", label: "Disease process" },
  { key: "medication class", label: "Medication class" },
  { key: "lab value/electrolyte issue", label: "Lab value / electrolyte" },
  { key: "cardiac condition", label: "Cardiac condition" },
  { key: "respiratory condition", label: "Respiratory condition" },
  { key: "neuro condition", label: "Neuro condition" },
  { key: "gi/gu condition", label: "GI / GU condition" },
  { key: "endocrine condition", label: "Endocrine condition" },
  { key: "ob/peds condition", label: "OB / Peds condition" },
  { key: "random medical topic", label: "Random medical topic" },
];

const ANSWER_OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
  { value: "unknown", label: "I don't know" },
];

const categoryLabel = (key: string | null) =>
  CATEGORIES.find((c) => c.key === key)?.label ?? key ?? "";

/** "heart failure" -> "Is it heart failure?"; pass through if already phrased */
const guessPrompt = (g: string) =>
  /^(is it|are you|is this|do you mean)\b/i.test(g.trim()) ? g.trim() : `Is it ${g.trim()}?`;

export function MedicalAkinatorGame({ onClose }: Props) {
  const reduce = useReducedMotion();

  // --- game state (as specified) ---
  const [category, setCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [solved, setSolved] = useState(false);

  // --- wrong-guess / reveal flow ---
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [revealInput, setRevealInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [safety, setSafety] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // real questions asked, excluding the synthetic "wrong guess" markers
  const askedCount = Math.max(0, answers.length - wrongGuesses);

  /* ask the backend for the next move given the full history */
  const advance = useCallback(async (history: QA[], cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/medical-akinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, answers: history }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      setConfidence(typeof data.confidence === "number" ? data.confidence : 0);
      if (data.status === "guess" && data.guess) {
        setGuess(data.guess);
        setSummary(data.summary ?? null);
        setCurrentQuestion(null);
      } else if (data.status === "question" && data.question) {
        setCurrentQuestion(data.question);
        setGuess(null);
      } else {
        throw new Error("unexpected-shape");
      }
    } catch {
      setError("The guessing engine is unavailable right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseCategory = useCallback(
    (cat: string) => {
      setCategory(cat);
      setGameStarted(true);
      setAnswers([]);
      setCurrentQuestion(null);
      setGuess(null);
      setSummary(null);
      setSolved(false);
      setWrongGuesses(0);
      setRevealing(false);
      setRevealInput("");
      setRevealed(false);
      setSafety(null);
      void advance([], cat);
    },
    [advance]
  );

  const answer = useCallback(
    (value: AnswerValue) => {
      if (!currentQuestion || !category || loading) return;
      const next = [...answers, { question: currentQuestion, answer: value }];
      setAnswers(next);
      setCurrentQuestion(null);
      void advance(next, category);
    },
    [advance, answers, category, currentQuestion, loading]
  );

  const confirmCorrect = useCallback(() => {
    setRevealed(false);
    setSolved(true);
  }, []);

  // wrong guess: record it in the exact agreed format so the engine rules it out;
  // after MAX_WRONG_GUESSES, stop guessing and ask the user what it actually was
  const keepGoing = useCallback(() => {
    if (!guess || !category || loading) return;
    const next: QA[] = [
      ...answers,
      { question: `The assistant guessed ${guess}. Was that correct?`, answer: "no" },
    ];
    const nextWrong = wrongGuesses + 1;
    setAnswers(next);
    setWrongGuesses(nextWrong);
    setGuess(null);
    if (nextWrong >= MAX_WRONG_GUESSES) {
      setRevealing(true); // give up gracefully → learning moment
    } else {
      void advance(next, category);
    }
  }, [advance, answers, category, guess, loading, wrongGuesses]);

  // the user tells us what they were thinking of → fetch a learning summary
  const submitReveal = useCallback(async () => {
    const what = revealInput.trim();
    if (!what || !category || loading) return;
    setLoading(true);
    setError(null);
    setSafety(null);
    try {
      const res = await fetch("/api/medical-akinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, answers, reveal: what }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      if (data.status === "safety") {
        setSafety(data.message || SAFETY_FALLBACK);
      } else if (data.status === "guess" && (data.guess || what)) {
        setGuess(data.guess || what);
        setSummary(data.summary ?? null);
        setRevealed(true);
        setRevealing(false);
        setSolved(true);
      } else {
        throw new Error("unexpected-shape");
      }
    } catch {
      setError("Could not load a summary right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [answers, category, loading, revealInput]);

  const retry = useCallback(() => {
    if (revealing) void submitReveal();
    else if (category) void advance(answers, category);
  }, [advance, answers, category, revealing, submitReveal]);

  const restart = useCallback(() => {
    setCategory(null);
    setAnswers([]);
    setCurrentQuestion(null);
    setGuess(null);
    setSummary(null);
    setConfidence(0);
    setError(null);
    setLoading(false);
    setGameStarted(false);
    setSolved(false);
    setWrongGuesses(0);
    setRevealing(false);
    setRevealInput("");
    setRevealed(false);
    setSafety(null);
  }, []);

  // Escape closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // move focus into the card when it opens
  useEffect(() => {
    const t = setTimeout(() => cardRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center sm:items-center sm:p-6">
      {/* scrim */}
      <m.button
        aria-label="Close Medical Akinator"
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-shadow)_30%,transparent)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        onClick={onClose}
      />

      {/* card */}
      <m.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Medical Akinator"
        tabIndex={-1}
        data-lenis-prevent
        className="relative flex max-h-full w-full flex-col overflow-hidden border border-[var(--color-granite-line)] bg-[var(--color-sand)] shadow-[0_2px_4px_rgba(60,64,73,0.08),0_24px_60px_-24px_rgba(60,64,73,0.5)] outline-none sm:w-[min(30rem,100vw)] sm:rounded-[var(--radius-md)]"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: reduce ? 0.15 : 0.34 }}
      >
        {/* header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-granite-line)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2 rounded-full ${gameStarted ? "bg-[var(--color-pine)]" : "bg-[var(--color-granite-line)]"}`}
              aria-hidden
            />
            <div>
              <p className="font-display text-[1.05rem] font-medium leading-none text-[var(--color-shadow)]">
                Medical Akinator
              </p>
              <p className="label-mono mt-1 text-[0.62rem] leading-none">
                {category ? categoryLabel(category) : "an educational guessing game"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-shadow)]"
          >
            <X size={18} />
          </button>
        </header>

        {/* body */}
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {!category ? (
            <CategoryPicker onPick={chooseCategory} />
          ) : error ? (
            <ErrorState message={error} onRetry={retry} onRestart={restart} />
          ) : solved && guess ? (
            <SolvedView guess={guess} summary={summary} revealed={revealed} onRestart={restart} onClose={onClose} />
          ) : revealing ? (
            loading ? (
              <Thinking label="looking it up" />
            ) : (
              <RevealView value={revealInput} setValue={setRevealInput} onSubmit={submitReveal} safety={safety} />
            )
          ) : loading || (!currentQuestion && !guess) ? (
            <Thinking label={askedCount === 0 ? "warming up" : "narrowing it down"} />
          ) : guess ? (
            <GuessView guess={guess} confidence={confidence} onCorrect={confirmCorrect} onKeepGoing={keepGoing} />
          ) : currentQuestion ? (
            <QuestionView question={currentQuestion} count={askedCount} onAnswer={answer} />
          ) : (
            <Thinking label="narrowing it down" />
          )}
        </div>

        {/* footer — restart is available once a round is underway */}
        {gameStarted && (
          <footer className="flex shrink-0 items-center justify-between border-t border-[var(--color-granite-line)] px-5 py-2.5">
            <p className="label-mono text-[0.6rem]">
              {askedCount} {askedCount === 1 ? "question" : "questions"}
              {wrongGuesses > 0 && ` · ${wrongGuesses}/${MAX_WRONG_GUESSES} wrong`}
            </p>
            <button
              onClick={restart}
              className="label-mono rounded-sm px-2 py-1 text-[0.62rem] text-[var(--color-muted)] transition-colors hover:text-[var(--color-pine)]"
            >
              Restart
            </button>
          </footer>
        )}
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  views                                                             */
/* ------------------------------------------------------------------ */

function CategoryPicker({ onPick }: { onPick: (key: string) => void }) {
  return (
    <div>
      <p className="text-[0.92rem] leading-relaxed text-[var(--color-shadow)]">
        Think of a medical condition, disease process, medication class, lab abnormality, or
        nursing concept. Pick a category and I&apos;ll try to guess it with yes / no questions.
      </p>
      <p className="label-mono mb-2 mt-5 text-[0.6rem]">choose a category</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onPick(c.key)}
            className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-2.5 text-left text-[0.85rem] text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionView({
  question,
  count,
  onAnswer,
}: {
  question: string;
  count: number;
  onAnswer: (v: AnswerValue) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label-mono text-[0.6rem]">question {count + 1}</p>
        <p className="mt-2 text-pretty text-[1.15rem] font-medium leading-snug text-[var(--color-shadow)]">
          {question}
        </p>
        {/* progress during question mode — NOT confidence */}
        <ProgressMeter count={count} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ANSWER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onAnswer(o.value)}
            className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-2.5 text-[0.9rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GuessView({
  guess,
  confidence,
  onCorrect,
  onKeepGoing,
}: {
  guess: string;
  confidence: number;
  onCorrect: () => void;
  onKeepGoing: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label-mono text-[0.6rem] text-[var(--color-pine)]">my guess</p>
        <p className="mt-2 text-pretty text-[1.35rem] font-medium leading-snug text-[var(--color-shadow)]">
          {guessPrompt(guess)}
        </p>
        {/* confidence is shown ONLY on a final guess */}
        <ConfidenceMeter value={confidence} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onCorrect}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-3.5 py-2.5 text-[0.9rem] font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)] active:scale-[0.98]"
        >
          <Check size={15} />
          Correct
        </button>
        <button
          onClick={onKeepGoing}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2.5 text-[0.9rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]"
        >
          Wrong, keep going
        </button>
      </div>
    </div>
  );
}

function RevealView({
  value,
  setValue,
  onSubmit,
  safety,
}: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  safety: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="label-mono text-[0.6rem] text-[var(--color-pine)]">I&apos;m stumped</p>
        <p className="mt-2 text-pretty text-[1.1rem] font-medium leading-snug text-[var(--color-shadow)]">
          Three guesses in and I didn&apos;t get it. What were you thinking of? I&apos;ll give you the
          rundown.
        </p>
      </div>

      {safety && <SafetyCard message={safety} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-2 focus-within:border-[var(--color-pine)]">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. heart failure, hyperkalemia, beta blockers"
            aria-label="What were you thinking of?"
            className="min-w-0 flex-1 bg-transparent text-[0.92rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <button
            type="submit"
            aria-label="Show the answer"
            disabled={!value.trim()}
            className="flex items-center gap-1 rounded-xs bg-[var(--color-pine)] px-2.5 py-1.5 text-[var(--color-on-dark)] transition-opacity disabled:opacity-40"
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

function SolvedView({
  guess,
  summary,
  revealed,
  onRestart,
  onClose,
}: {
  guess: string;
  summary: Summary | null;
  revealed: boolean;
  onRestart: () => void;
  onClose: () => void;
}) {
  const rows: [string, string][] = summary
    ? ([
        ["What it is", summary.whatItIs],
        ["Key signs / symptoms", summary.signsSymptoms],
        ["Nursing priorities", summary.nursingPriorities],
        ["NCLEX clue", summary.nclexClue],
      ].filter(([, v]) => v) as [string, string][])
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {revealed ? (
          <span className="label-mono text-[0.6rem] text-[var(--color-muted)]">you stumped me · the answer</span>
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-[var(--color-pine)] text-[var(--color-on-dark)]">
            <Check size={14} />
          </span>
        )}
      </div>
      <p className="-mt-3 font-display text-[1.2rem] font-medium capitalize text-[var(--color-shadow)]">{guess}</p>

      {rows.length > 0 ? (
        <dl className="space-y-3 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3.5">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="label-mono text-[0.6rem] text-[var(--color-pine)]">{k}</dt>
              <dd className="mt-0.5 text-[0.86rem] leading-relaxed text-[var(--color-shadow)]">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-[0.88rem] leading-relaxed text-[var(--color-muted)]">
          {revealed ? "Noted. Worth a quick review on your own." : "Nice. Got it."}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onRestart}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-3.5 py-2.5 text-[0.9rem] font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)] active:scale-[0.98]"
        >
          Play again
          <ArrowRight size={15} />
        </button>
        <button
          onClick={onClose}
          className="inline-flex flex-1 items-center justify-center rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2.5 text-[0.9rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function SafetyCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3">
      <p className="label-mono text-[0.6rem] text-[var(--color-golden-deep)]">a quick note</p>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-[var(--color-shadow)]">{message}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  onRestart,
}: {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[0.9rem] leading-relaxed text-[var(--color-shadow)]">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="rounded-sm bg-[var(--color-pine)] px-3.5 py-2 text-[0.85rem] font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
        >
          Try again
        </button>
        <button
          onClick={onRestart}
          className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2 text-[0.85rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

/** progress toward a guess during question mode — deliberately NOT a confidence value */
function ProgressMeter({ count }: { count: number }) {
  const TARGET = 15; // a soft sense of "how far along", not a hard limit
  const pct = Math.round((Math.min(count, TARGET) / TARGET) * 100);
  return (
    <div className="mt-4 flex items-center gap-2.5">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-granite)]">
        <div
          className="h-full rounded-full bg-[var(--color-pine)] transition-[width] duration-300"
          style={{ width: `${Math.max(6, pct)}%` }}
        />
      </div>
      <span className="label-mono text-[0.58rem]">narrowing it down</span>
    </div>
  );
}

/** confidence — only rendered on a final guess */
function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="mt-4 flex items-center gap-2.5">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-granite)]">
        <div className="h-full rounded-full bg-[var(--color-pine)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="label-mono tnum text-[0.58rem]">{pct}% sure</span>
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" role="status" aria-label="Thinking">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-[var(--color-muted)]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="label-mono text-[0.6rem]">{label}</p>
    </div>
  );
}

/* convenience re-export so a consumer can render the modal with AnimatePresence */
export function MedicalAkinatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <MedicalAkinatorGame onClose={onClose} />}</AnimatePresence>;
}
