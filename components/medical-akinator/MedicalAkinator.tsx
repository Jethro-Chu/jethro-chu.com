"use client";

/* ============================================================
   MEDICAL AKINATOR  ·  Isabel-powered symptom checker (hidden)
   ============================================================
   Opened only by submitting the exact command "akinator" in the hero
   command bar. An Akinator-style flow: the user names a symptom in
   plain language, then answers one question at a time while the
   server (POST /api/isabel) narrows things down using the Isabel
   Symptom Checker API as the ONLY medical data source.

   This component is pure UI/flow. It never calls Isabel or any LLM
   directly — it only talks to the same-origin /api/isabel route, which
   holds all keys. If Isabel is unavailable it shows a clean retry
   state; it never invents conditions.

   Aesthetic matches the site: sand surface, hairline rules, monospace
   labels, pine accent, soft radii, reduced-motion respected.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { X, ArrowRight, CornerDownLeft, ArrowUpRight } from "@/components/ask-jethro/icons";
import type {
  AkinatorApiResponse,
  AnswerValue,
  IsabelResults,
  IsabelSuggestedQuestion,
  Progress,
  SessionState,
} from "@/lib/isabelApi";

interface Props {
  onClose: () => void;
}

type Phase = "intro" | "question" | "results" | "emergency" | "unavailable";

const ANSWER_OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "probably", label: "Probably" },
  { value: "probably_not", label: "Probably not" },
  { value: "unknown", label: "I don't know" },
];

/** the exact request bodies the route accepts */
type StartRequest = { phase: "start"; complaint: string };
type AnswerRequest = { phase: "answer"; state: SessionState; question: IsabelSuggestedQuestion; answer: AnswerValue };
type AkRequest = StartRequest | AnswerRequest;

export function MedicalAkinatorModal({ onClose }: Props) {
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("intro");
  const [complaint, setComplaint] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [question, setQuestion] = useState<IsabelSuggestedQuestion | null>(null);
  const [results, setResults] = useState<IsabelResults | null>(null);
  const [progress, setProgress] = useState<Progress>({ asked: 0, min: 5, max: 12 });
  const [message, setMessage] = useState<string>(""); // emergency / unavailable copy
  const [loading, setLoading] = useState(false);

  const lastRequest = useRef<AkRequest | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleResponse = useCallback((data: AkinatorApiResponse | null) => {
    if (!data) {
      setMessage("The symptom checker is temporarily unavailable. Please try again in a moment.");
      setPhase("unavailable");
      return;
    }
    switch (data.status) {
      case "question":
        setSession(data.state);
        setQuestion(data.question);
        setProgress(data.progress);
        setPhase("question");
        break;
      case "results":
        setSession(data.state);
        setResults(data.results);
        setProgress(data.progress);
        setPhase("results");
        break;
      case "emergency":
        setMessage(data.message);
        setPhase("emergency");
        break;
      case "disabled":
      case "unavailable":
      default:
        setMessage(("message" in data && data.message) || "The symptom checker is temporarily unavailable.");
        setPhase("unavailable");
        break;
    }
  }, []);

  const send = useCallback(
    async (req: AkRequest) => {
      lastRequest.current = req;
      setLoading(true);
      try {
        const res = await fetch("/api/isabel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        });
        // a 503 still carries a JSON {status:"unavailable"} body we can render
        const data = (await res.json().catch(() => null)) as AkinatorApiResponse | null;
        handleResponse(data);
      } catch {
        handleResponse(null);
      } finally {
        setLoading(false);
      }
    },
    [handleResponse],
  );

  const start = useCallback(() => {
    const text = complaint.trim();
    if (!text || loading) return;
    void send({ phase: "start", complaint: text });
  }, [complaint, loading, send]);

  const answer = useCallback(
    (value: AnswerValue) => {
      if (!session || !question || loading) return;
      void send({ phase: "answer", state: session, question, answer: value });
    },
    [session, question, loading, send],
  );

  const retry = useCallback(() => {
    if (lastRequest.current) void send(lastRequest.current);
  }, [send]);

  const restart = useCallback(() => {
    lastRequest.current = null;
    setComplaint("");
    setSession(null);
    setQuestion(null);
    setResults(null);
    setProgress({ asked: 0, min: 5, max: 12 });
    setMessage("");
    setLoading(false);
    setPhase("intro");
  }, []);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // move focus into the card on mount
  useEffect(() => {
    const t = setTimeout(() => cardRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  const started = phase !== "intro";

  // Mounted only while open (the provider renders it conditionally), so closing
  // unmounts instantly. Entrance is animated via initial/animate on the children.
  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center sm:items-center sm:p-6">
      <m.button
        aria-label="Close symptom checker"
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-shadow)_30%,transparent)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        onClick={onClose}
      />

      <m.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Symptom checker"
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
              className={`size-2 rounded-full ${started ? "bg-[var(--color-pine)]" : "bg-[var(--color-granite-line)]"}`}
              aria-hidden
            />
            <div>
              <p className="font-display text-[1.05rem] font-medium leading-none text-[var(--color-shadow)]">
                Symptom checker
              </p>
              <p className="label-mono mt-1 text-[0.62rem] leading-none">powered by Isabel · not a diagnosis</p>
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
          {loading ? (
            <Thinking label={phase === "intro" ? "checking your symptoms" : "narrowing it down"} />
          ) : phase === "intro" ? (
            <IntroView value={complaint} setValue={setComplaint} onStart={start} />
          ) : phase === "question" && question ? (
            <QuestionView question={question} progress={progress} onAnswer={answer} />
          ) : phase === "results" && results ? (
            <ResultsView results={results} onRestart={restart} onClose={onClose} />
          ) : phase === "emergency" ? (
            <EmergencyView message={message} onClose={onClose} />
          ) : (
            <UnavailableView message={message} onRetry={retry} onRestart={restart} />
          )}
        </div>

        {/* footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--color-granite-line)] px-5 py-2.5">
          <p className="label-mono text-[0.58rem] leading-tight">
            educational only · call 911 in an emergency
          </p>
          {started && phase !== "emergency" && (
            <button
              onClick={restart}
              className="label-mono shrink-0 rounded-sm px-2 py-1 text-[0.62rem] text-[var(--color-muted)] transition-colors hover:text-[var(--color-pine)]"
            >
              Start over
            </button>
          )}
        </footer>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  views                                                             */
/* ------------------------------------------------------------------ */

function IntroView({
  value,
  setValue,
  onStart,
}: {
  value: string;
  setValue: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-[1.3rem] font-medium leading-snug text-[var(--color-shadow)]">
          What symptom are you most concerned about today?
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--color-muted)]">
          Describe it in your own words. For example, &ldquo;my throat hurts and I feel hot&rdquo; or
          &ldquo;I&apos;ve been coughing for three days.&rdquo;
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStart();
        }}
      >
        <div className="flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-2 focus-within:border-[var(--color-pine)]">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe your main symptom…"
            aria-label="Describe your main symptom"
            className="min-w-0 flex-1 bg-transparent text-[0.92rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <button
            type="submit"
            aria-label="Start"
            disabled={!value.trim()}
            className="flex items-center gap-1 rounded-xs bg-[var(--color-pine)] px-2.5 py-1.5 text-[var(--color-on-dark)] transition-opacity disabled:opacity-40"
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
      </form>

      <p className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-[var(--color-muted)]">
        This is an educational symptom explorer, not medical advice or a diagnosis. It uses the Isabel
        Symptom Checker for its medical information. If you think you have an emergency, call 911 or
        seek care now.
      </p>
    </div>
  );
}

function QuestionView({
  question,
  progress,
  onAnswer,
}: {
  question: IsabelSuggestedQuestion;
  progress: Progress;
  onAnswer: (v: AnswerValue) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label-mono text-[0.6rem]">question {progress.asked + 1}</p>
        <p className="mt-2 text-pretty text-[1.2rem] font-medium leading-snug text-[var(--color-shadow)]">
          {question.text}
        </p>
        <ProgressMeter progress={progress} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ANSWER_OPTIONS.slice(0, 4).map((o) => (
          <AnswerButton key={o.value} label={o.label} onClick={() => onAnswer(o.value)} />
        ))}
        <div className="col-span-2">
          <AnswerButton label="I don't know" onClick={() => onAnswer("unknown")} subtle />
        </div>
      </div>
    </div>
  );
}

function AnswerButton({ label, onClick, subtle }: { label: string; onClick: () => void; subtle?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-sm border border-[var(--color-granite-line)] px-3 py-2.5 text-[0.9rem] font-medium transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] active:scale-[0.98] ${
        subtle ? "bg-[var(--color-sand)] text-[var(--color-muted)]" : "bg-[var(--color-card)] text-[var(--color-shadow)]"
      }`}
    >
      {label}
    </button>
  );
}

function ResultsView({
  results,
  onRestart,
  onClose,
}: {
  results: IsabelResults;
  onRestart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="label-mono text-[0.6rem] text-[var(--color-pine)]">possible explanations</p>
        {results.explanation && (
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--color-shadow)]">{results.explanation}</p>
        )}
      </div>

      <ol className="space-y-2.5">
        {results.conditions.map((c, i) => (
          <li
            key={`${c.name}-${i}`}
            className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[1.02rem] font-medium text-[var(--color-shadow)]">
                <span className="label-mono mr-2 text-[var(--color-muted)]">{i + 1}</span>
                {c.name}
              </p>
              {typeof c.confidence === "number" && (
                <span className="label-mono tnum shrink-0 text-[0.6rem] text-[var(--color-pine)]">
                  {Math.round(c.confidence * 100)}% match
                </span>
              )}
            </div>
            {c.careLevel && (
              <p className="label-mono mt-1.5 inline-block rounded-xs border border-[var(--color-granite-line)] px-1.5 py-0.5 text-[0.56rem] text-[var(--color-golden-deep)]">
                {c.careLevel}
              </p>
            )}
            {c.summary && (
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-[var(--color-muted)]">{c.summary}</p>
            )}
            {c.sources && c.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {c.sources.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.74rem] font-medium text-[var(--color-pine)] hover:text-[var(--color-pine-deep)]"
                  >
                    {s.title}
                    <ArrowUpRight size={11} />
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {results.careGuidance?.careLevel && (
        <p className="text-[0.84rem] leading-relaxed text-[var(--color-shadow)]">
          <span className="label-mono text-[0.6rem] text-[var(--color-pine)]">suggested care · </span>
          {results.careGuidance.careLevel}
        </p>
      )}

      <p className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2.5 text-[0.76rem] leading-relaxed text-[var(--color-muted)]">
        These are possibilities to discuss with a clinician, not a diagnosis. {results.attribution ?? ""}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onRestart}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-3.5 py-2.5 text-[0.9rem] font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)] active:scale-[0.98]"
        >
          Start over
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

function EmergencyView({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="label-mono text-[0.6rem] text-[var(--color-golden-deep)]">please get help</p>
      <p className="text-[0.95rem] leading-relaxed text-[var(--color-shadow)]">{message}</p>
      <button
        onClick={onClose}
        className="rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2 text-[0.85rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
      >
        Close
      </button>
    </div>
  );
}

function UnavailableView({
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
      <p className="label-mono text-[0.6rem] text-[var(--color-muted)]">symptom checker</p>
      <p className="text-[0.9rem] leading-relaxed text-[var(--color-shadow)]">
        {message || "The symptom checker is temporarily unavailable. Please try again in a moment."}
      </p>
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
          Start over
        </button>
      </div>
    </div>
  );
}

function ProgressMeter({ progress }: { progress: Progress }) {
  const pct = Math.round((Math.min(progress.asked, progress.max) / progress.max) * 100);
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

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-label="Thinking">
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

