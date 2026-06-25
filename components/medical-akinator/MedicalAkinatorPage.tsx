"use client";

/* ============================================================
   MEDICAL AKINATOR  ·  full-page game (route: /medical-akinator)
   Reached from the hero command bar by submitting "akinator".
   The player thinks of a medication or medical topic; a Gemini-backed
   engine (server route /api/medical-akinator) asks one yes/no/maybe/
   unknown question at a time, narrows a candidate list over time, then
   guesses. Standalone, immersive, full-page — not a modal.

   Aesthetic matches the rest of the site (resume/project pages): sand
   background wash + route line, hairline rules, monospace labels, pine
   accent, soft radii. Gemini is never called from the browser; this
   component only hits the same-origin API route.
   ============================================================ */

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m, useReducedMotion } from "framer-motion";
import { site } from "@/content/content";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { RouteLine } from "@/components/scenery/RouteLine";
import { Check, ArrowRight, CornerDownLeft } from "@/components/ask-jethro/icons";

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

/* The two starting scopes. `key` is sent to the API (and must match the route's
   allowlist); `label` is what the player sees. */
const CATEGORIES: { key: string; label: string; hint: string }[] = [
  { key: "medication", label: "Medication", hint: "a drug, drug class, or pharmacology concept" },
  { key: "medical_topic", label: "Medical topic", hint: "any non-medication nursing or medical topic" },
];

const ANSWER_OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
  { value: "unknown", label: "I don't know" },
];

const categoryLabel = (key: string | null) => CATEGORIES.find((c) => c.key === key)?.label ?? key ?? "";

/** "heart failure" -> "My guess is heart failure. Am I right?"; pass through if already phrased */
const guessPrompt = (g: string) => {
  const t = g.trim();
  return /^(my guess is|is it|are you|is this|do you mean)\b/i.test(t) ? t : `My guess is ${t}. Am I right?`;
};

export function MedicalAkinatorPage() {
  const reduce = useReducedMotion();
  const router = useRouter();

  // --- game state ---
  const [category, setCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // --- wrong-guess / reveal flow ---
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [revealInput, setRevealInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [safety, setSafety] = useState<string | null>(null);

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
    } catch (err) {
      // surface the real failure to the console; show the friendly message in the UI
      console.error("[medical-akinator] question generation failed:", err);
      setError("The guessing engine is unavailable right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseCategory = useCallback(
    (cat: string) => {
      setCategory(cat);
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
    [advance],
  );

  const answer = useCallback(
    (value: AnswerValue) => {
      if (!currentQuestion || !category || loading) return;
      const next = [...answers, { question: currentQuestion, answer: value }];
      setAnswers(next);
      setCurrentQuestion(null);
      void advance(next, category);
    },
    [advance, answers, category, currentQuestion, loading],
  );

  const confirmCorrect = useCallback(() => {
    setRevealed(false);
    setSolved(true);
  }, []);

  // wrong guess: record it in the exact agreed format so the engine rules it out;
  // after MAX_WRONG_GUESSES, stop guessing and ask the user what it actually was
  const keepGoing = useCallback(() => {
    if (!guess || !category || loading) return;
    const next: QA[] = [...answers, { question: `The assistant guessed ${guess}. Was that correct?`, answer: "no" }];
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
    } catch (err) {
      console.error("[medical-akinator] reveal failed:", err);
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
    setSolved(false);
    setWrongGuesses(0);
    setRevealing(false);
    setRevealInput("");
    setRevealed(false);
    setSafety(null);
  }, []);

  const exit = useCallback(() => router.push("/"), [router]);

  // which screen is showing — also used as the animation key so each phase
  // (and each new question) fades in fresh
  const phaseKey = !category
    ? "start"
    : error
      ? "error"
      : solved && guess
        ? "solved"
        : revealing
          ? loading
            ? "reveal-loading"
            : "reveal"
          : loading || (!currentQuestion && !guess)
            ? "thinking"
            : guess
              ? "guess"
              : currentQuestion
                ? `q-${askedCount}`
                : "thinking";

  const inGame = category !== null && !solved;

  return (
    <div className="relative flex min-h-screen flex-col">
      <BackgroundGradient />
      <RouteLine />

      {/* top bar — back to the portfolio (exit) */}
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-medium text-[var(--color-shadow)]"
        >
          <span aria-hidden className="text-[var(--color-pine)] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          {site.name}
        </Link>
        <span className="label-mono">medical akinator</span>
      </header>

      {/* the game — centered, spacious, the question is the focus */}
      <main id="main" className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <m.div
          key={phaseKey}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          {!category ? (
            <StartScreen onPick={chooseCategory} />
          ) : error ? (
            <ErrorScreen message={error} onRetry={retry} onRestart={restart} onExit={exit} />
          ) : solved && guess ? (
            <SolvedScreen guess={guess} summary={summary} revealed={revealed} onRestart={restart} onExit={exit} />
          ) : revealing ? (
            loading ? (
              <Thinking label="looking it up" />
            ) : (
              <RevealScreen
                value={revealInput}
                setValue={setRevealInput}
                onSubmit={submitReveal}
                safety={safety}
                onRestart={restart}
              />
            )
          ) : loading || (!currentQuestion && !guess) ? (
            <Thinking label={askedCount === 0 ? "warming up" : "narrowing it down"} />
          ) : guess ? (
            <GuessScreen
              guess={guess}
              confidence={confidence}
              category={category}
              onCorrect={confirmCorrect}
              onKeepGoing={keepGoing}
              onRestart={restart}
            />
          ) : currentQuestion ? (
            <QuestionScreen
              question={currentQuestion}
              count={askedCount}
              category={category}
              wrongGuesses={wrongGuesses}
              onAnswer={answer}
              onRestart={restart}
            />
          ) : (
            <Thinking label="narrowing it down" />
          )}
        </m.div>
      </main>

      {/* a quiet game footer; restart is always reachable mid-round */}
      <footer className="relative z-10 flex items-center justify-between border-t border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <p className="label-mono text-[0.6rem]">educational only · not medical advice</p>
        {inGame ? (
          <button
            onClick={restart}
            className="label-mono rounded-sm px-2 py-1 text-[0.62rem] text-[var(--color-muted)] transition-colors hover:text-[var(--color-pine)]"
          >
            Restart
          </button>
        ) : (
          <Link href="/" className="label-mono transition-colors hover:text-[var(--color-pine)]">
            ← Back to portfolio
          </Link>
        )}
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  shared bits                                                       */
/* ------------------------------------------------------------------ */

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--color-pine)] px-5 py-3 text-[0.95rem] font-medium text-[var(--color-on-dark)] transition duration-150 ease-[var(--ease-fast)] hover:bg-[var(--color-pine-deep)] active:scale-[0.98]";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-5 py-3 text-[0.95rem] font-medium text-[var(--color-shadow)] transition duration-150 ease-[var(--ease-fast)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]";

/** category label + question count, shown above the question/guess */
function GameHeading({ category, right }: { category: string; right?: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="label-mono text-[var(--color-pine)]">{categoryLabel(category)}</p>
      {right && <p className="label-mono">{right}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  screens                                                           */
/* ------------------------------------------------------------------ */

function StartScreen({ onPick }: { onPick: (key: string) => void }) {
  return (
    <div className="text-center">
      <p className="label-mono">an educational guessing game</p>
      <h1 className="text-summit mt-3 text-[var(--color-shadow)]">Medical Akinator</h1>
      <p className="mx-auto mt-6 max-w-md text-pretty text-lg leading-relaxed text-[var(--color-muted)] sm:text-xl">
        Think of a medication or medical topic and I&apos;ll try to guess it with yes / no questions.
      </p>

      <p className="label-mono mb-3 mt-12">choose a starting scope</p>
      <div className="mx-auto grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onPick(c.key)}
            className="group rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-5 py-6 text-center transition-colors hover:border-[var(--color-pine)] active:scale-[0.99]"
          >
            <span className="font-display text-[1.2rem] font-medium text-[var(--color-shadow)] transition-colors group-hover:text-[var(--color-pine)]">
              {c.label}
            </span>
            <span className="mt-1.5 block text-[0.8rem] leading-snug text-[var(--color-muted)]">{c.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  count,
  category,
  wrongGuesses,
  onAnswer,
  onRestart,
}: {
  question: string;
  count: number;
  category: string;
  wrongGuesses: number;
  onAnswer: (v: AnswerValue) => void;
  onRestart: () => void;
}) {
  return (
    <div>
      <GameHeading category={category} right={`question ${count + 1}`} />
      <ProgressMeter count={count} />

      <p className="mt-10 text-balance text-center font-display text-[1.7rem] font-medium leading-[1.15] text-[var(--color-shadow)] sm:mt-12 sm:text-[2.2rem]">
        {question}
      </p>

      <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2">
        {ANSWER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onAnswer(o.value)}
            className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-5 py-4 text-[1.02rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98]"
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button onClick={onRestart} className="label-mono transition-colors hover:text-[var(--color-pine)]">
          Restart
        </button>
        {wrongGuesses > 0 && (
          <span className="label-mono text-[var(--color-muted)]">
            {wrongGuesses}/{MAX_WRONG_GUESSES} wrong
          </span>
        )}
      </div>
    </div>
  );
}

function GuessScreen({
  guess,
  confidence,
  category,
  onCorrect,
  onKeepGoing,
  onRestart,
}: {
  guess: string;
  confidence: number;
  category: string;
  onCorrect: () => void;
  onKeepGoing: () => void;
  onRestart: () => void;
}) {
  return (
    <div>
      <GameHeading category={category} right="my guess" />
      <ConfidenceMeter value={confidence} />

      <p className="mt-10 text-balance text-center font-display text-[1.8rem] font-medium leading-[1.15] text-[var(--color-shadow)] sm:mt-12 sm:text-[2.4rem]">
        {guessPrompt(guess)}
      </p>

      <div className="mx-auto mt-12 flex max-w-lg flex-col gap-3 sm:flex-row">
        <button onClick={onCorrect} className={`${primaryBtn} flex-1`}>
          <Check size={16} />
          Yes
        </button>
        <button onClick={onKeepGoing} className={`${secondaryBtn} flex-1`}>
          No, keep going
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={onRestart} className="label-mono transition-colors hover:text-[var(--color-pine)]">
          Restart
        </button>
      </div>
    </div>
  );
}

function RevealScreen({
  value,
  setValue,
  onSubmit,
  safety,
  onRestart,
}: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  safety: string | null;
  onRestart: () => void;
}) {
  return (
    <div className="text-center">
      <p className="label-mono text-[var(--color-pine)]">I&apos;m stumped</p>
      <p className="mx-auto mt-4 max-w-lg text-balance font-display text-[1.5rem] font-medium leading-snug text-[var(--color-shadow)] sm:text-[1.9rem]">
        Three guesses in and I didn&apos;t get it. What were you thinking of?
      </p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--color-muted)]">I&apos;ll give you the rundown.</p>

      {safety && (
        <div className="mx-auto mt-6 max-w-lg">
          <SafetyCard message={safety} />
        </div>
      )}

      <form
        className="mx-auto mt-7 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-2.5 focus-within:border-[var(--color-pine)]">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. heart failure, beta blockers"
            aria-label="What were you thinking of?"
            className="min-w-0 flex-1 bg-transparent text-[0.98rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <button
            type="submit"
            aria-label="Show the answer"
            disabled={!value.trim()}
            className="flex items-center gap-1 rounded-xs bg-[var(--color-pine)] px-3 py-2 text-[var(--color-on-dark)] transition-opacity disabled:opacity-40"
          >
            <CornerDownLeft size={16} />
          </button>
        </div>
      </form>

      <div className="mt-8 flex justify-center">
        <button onClick={onRestart} className="label-mono transition-colors hover:text-[var(--color-pine)]">
          Restart
        </button>
      </div>
    </div>
  );
}

function SolvedScreen({
  guess,
  summary,
  revealed,
  onRestart,
  onExit,
}: {
  guess: string;
  summary: Summary | null;
  revealed: boolean;
  onRestart: () => void;
  onExit: () => void;
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
    <div>
      <div className="text-center">
        {revealed ? (
          <p className="label-mono text-[var(--color-muted)]">you stumped me · the answer</p>
        ) : (
          <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-[var(--color-pine)] text-[var(--color-on-dark)]">
            <Check size={18} />
          </span>
        )}
        <h2 className="mt-4 font-display text-[2rem] font-medium capitalize leading-tight text-[var(--color-shadow)] sm:text-[2.4rem]">
          {guess}
        </h2>
      </div>

      {rows.length > 0 ? (
        <dl className="mx-auto mt-8 max-w-xl space-y-4 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-5 py-5 sm:px-6">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="label-mono text-[var(--color-pine)]">{k}</dt>
              <dd className="mt-1 text-[0.95rem] leading-relaxed text-[var(--color-shadow)]">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-6 text-center text-[0.95rem] leading-relaxed text-[var(--color-muted)]">
          {revealed ? "Noted. Worth a quick review on your own." : "Nice. Got it."}
        </p>
      )}

      <div className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row">
        <button onClick={onRestart} className={`${primaryBtn} flex-1`}>
          Play again
          <ArrowRight size={16} />
        </button>
        <button onClick={onExit} className={`${secondaryBtn} flex-1`}>
          Exit
        </button>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
  onRestart,
  onExit,
}: {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="text-center">
      <p className="label-mono text-[var(--color-golden-deep)]">hmm</p>
      <p className="mx-auto mt-4 max-w-lg text-balance font-display text-[1.5rem] font-medium leading-snug text-[var(--color-shadow)] sm:text-[1.8rem]">
        {message}
      </p>
      <div className="mx-auto mt-9 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onRetry} className={primaryBtn}>
          Try again
        </button>
        <button onClick={onRestart} className={secondaryBtn}>
          Restart
        </button>
        <button onClick={onExit} className="label-mono px-2 py-1 transition-colors hover:text-[var(--color-pine)]">
          Exit
        </button>
      </div>
    </div>
  );
}

function SafetyCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3 text-left">
      <p className="label-mono text-[var(--color-golden-deep)]">a quick note</p>
      <p className="mt-1 text-[0.9rem] leading-relaxed text-[var(--color-shadow)]">{message}</p>
    </div>
  );
}

/** progress toward a guess during question mode — deliberately NOT a confidence value */
function ProgressMeter({ count }: { count: number }) {
  const TARGET = 15; // a soft sense of "how far along", not a hard limit
  const pct = Math.round((Math.min(count, TARGET) / TARGET) * 100);
  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-granite)]">
        <div
          className="h-full rounded-full bg-[var(--color-pine)] transition-[width] duration-300"
          style={{ width: `${Math.max(6, pct)}%` }}
        />
      </div>
      <span className="label-mono shrink-0 text-[0.6rem]">narrowing it down</span>
    </div>
  );
}

/** confidence — only rendered on a final guess */
function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-granite)]">
        <div
          className="h-full rounded-full bg-[var(--color-pine)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="label-mono tnum shrink-0 text-[0.6rem]">{pct}% sure</span>
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 py-16" role="status" aria-label="Thinking">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-[var(--color-muted)]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="label-mono">{label}</p>
    </div>
  );
}
