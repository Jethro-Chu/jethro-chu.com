"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowUpRight, Copy, Check, CornerDownLeft } from "./icons";
import { generateJethroAnswer, type AssistantAnswer, type AssistantAction } from "@/lib/askJethro";
import { projectById, suggestedQuestions, profile } from "@/content/profile";

/* ------------------------------------------------------------------ */
/*  context                                                            */
/* ------------------------------------------------------------------ */

interface AskJethroCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** open the panel and submit a question (optionally about a project) */
  ask: (question: string, context?: { projectId?: string }) => void;
  /** open the panel with the input pre-filled but not submitted */
  prefill: (question: string) => void;
}

const Ctx = createContext<AskJethroCtx | null>(null);

export function useAskJethro(): AskJethroCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAskJethro must be used within <AskJethroProvider>");
  return v;
}

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; answer: AssistantAnswer; fresh: boolean }
  | { id: number; role: "casestudy"; projectId: string };

/* ------------------------------------------------------------------ */
/*  provider (owns state, renders the panel)                          */
/* ------------------------------------------------------------------ */

export function AskJethroProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const id = () => nextId.current++;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const submit = useCallback((question: string, context?: { projectId?: string }) => {
    const text = question.trim();
    if (!text) return;
    const answer = generateJethroAnswer(text, context);
    setMessages((m) => [
      ...m,
      { id: id(), role: "user", text },
      { id: id(), role: "assistant", answer, fresh: true },
    ]);
    setInput("");
  }, []);

  const ask = useCallback(
    (question: string, context?: { projectId?: string }) => {
      setIsOpen(true);
      submit(question, context);
    },
    [submit]
  );

  const prefill = useCallback((question: string) => {
    setIsOpen(true);
    setInput(question);
  }, []);

  const showCaseStudy = useCallback((projectId: string) => {
    setMessages((m) => [...m, { id: id(), role: "casestudy", projectId }]);
  }, []);

  const handleAction = useCallback(
    (action: AssistantAction) => {
      if (action.type === "open-link" && action.href) {
        window.open(action.href, action.href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
      } else if (action.type === "ask" && action.question) {
        submit(action.question);
      } else if (action.type === "view-case-study" && action.projectId) {
        showCaseStudy(action.projectId);
      }
    },
    [submit, showCaseStudy]
  );

  // ⌘K / Ctrl-K toggles, Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = useMemo<AskJethroCtx>(() => ({ isOpen, open, close, ask, prefill }), [isOpen, open, close, ask, prefill]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <AskJethroPanel
        isOpen={isOpen}
        messages={messages}
        input={input}
        setInput={setInput}
        onSubmit={() => submit(input)}
        onClose={close}
        onAsk={(q) => submit(q)}
        onAction={handleAction}
      />
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  panel                                                              */
/* ------------------------------------------------------------------ */

function AskJethroPanel({
  isOpen,
  messages,
  input,
  setInput,
  onSubmit,
  onClose,
  onAsk,
  onAction,
}: {
  isOpen: boolean;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onAsk: (q: string) => void;
  onAction: (a: AssistantAction) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // focus the input when opened
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // keep the thread scrolled to the newest message
  useEffect(() => {
    if (isOpen && threadRef.current) {
      threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }
  }, [messages, isOpen, reduce]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* scrim */}
          <motion.button
            aria-label="Close assistant"
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-shadow)_28%,transparent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
          />
          {/* panel: right drawer on desktop, full sheet on mobile */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ask Jethro"
            className="absolute inset-x-0 bottom-0 top-0 flex flex-col border-[var(--color-granite-line)] bg-[var(--color-sand)] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(30rem,100vw)] sm:border-l"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: reduce ? 0.15 : 0.36 }}
            style={{ willChange: "transform" }}
          >
            {/* header */}
            <header className="flex items-center justify-between border-b border-[var(--color-granite-line)] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-[var(--color-pine)]" aria-hidden />
                <div>
                  <p className="font-display text-[1.05rem] font-medium leading-none text-[var(--color-shadow)]">
                    Ask Jethro
                  </p>
                  <p className="label-mono mt-1 text-[0.62rem] leading-none">grounded in real project data · demo</p>
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

            {/* thread */}
            <div ref={threadRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {messages.length === 0 ? (
                <EmptyState onAsk={onAsk} />
              ) : (
                messages.map((m) =>
                  m.role === "user" ? (
                    <UserBubble key={m.id} text={m.text} />
                  ) : m.role === "casestudy" ? (
                    <CaseStudyBlock key={m.id} projectId={m.projectId} onAction={onAction} />
                  ) : (
                    <AssistantBubble key={m.id} answer={m.answer} fresh={m.fresh} onAsk={onAsk} onAction={onAction} />
                  )
                )
              )}
            </div>

            {/* input */}
            <form
              className="border-t border-[var(--color-granite-line)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div className="flex items-center gap-2 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-2 focus-within:border-[var(--color-pine)]">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask what I've built, or why I'd be useful…"
                  aria-label="Ask Jethro a question"
                  className="min-w-0 flex-1 bg-transparent text-[0.92rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={!input.trim()}
                  className="flex items-center gap-1 rounded-xs bg-[var(--color-pine)] px-2.5 py-1.5 text-[var(--color-on-dark)] transition-opacity disabled:opacity-40"
                >
                  <CornerDownLeft size={15} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  pieces                                                             */
/* ------------------------------------------------------------------ */

function EmptyState({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <div className="pt-2">
      <p className="text-[0.95rem] leading-relaxed text-[var(--color-shadow)]">
        I&apos;m a thoughtful version of {profile.name.split(" ")[0]}, answering from his real projects and background. Ask
        me anything, or start here:
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {suggestedQuestions.slice(0, 6).map((q) => (
          <Chip key={q} label={q} onClick={() => onAsk(q)} block />
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[88%] rounded-md rounded-tr-xs bg-[var(--color-pine)] px-3.5 py-2 text-[0.92rem] leading-relaxed text-[var(--color-on-dark)]">
        {text}
      </p>
    </div>
  );
}

function AssistantBubble({
  answer,
  fresh,
  onAsk,
  onAction,
}: {
  answer: AssistantAnswer;
  fresh: boolean;
  onAsk: (q: string) => void;
  onAction: (a: AssistantAction) => void;
}) {
  const related = answer.relatedProjectIds
    .map((pid) => projectById(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="space-y-3">
      <div className="rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3">
        <StreamedText text={answer.text} animate={fresh} />
        <CopyButton text={answer.text} />
      </div>

      {related.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {related.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => onAsk(`What is ${p.title}?`)}
              className="label-mono rounded-xs border border-[var(--color-granite-line)] px-2 py-1 text-[0.66rem] text-[var(--color-pine)] transition-colors hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)]"
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {answer.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {answer.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction(a)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1.5 text-[0.78rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
            >
              {a.label}
              {a.type === "open-link" && <ArrowUpRight size={13} />}
            </button>
          ))}
        </div>
      )}

      {answer.followUps.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          {answer.followUps.slice(0, 3).map((q) => (
            <Chip key={q} label={q} onClick={() => onAsk(q)} block muted />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseStudyBlock({ projectId, onAction }: { projectId: string; onAction: (a: AssistantAction) => void }) {
  const p = projectById(projectId);
  if (!p) return null;
  const rows: [string, string][] = [
    ["Problem", p.caseStudy.problem],
    ["Insight", p.caseStudy.insight],
    ["Build", p.caseStudy.build],
    ["State", p.caseStudy.state],
    ["Next", p.caseStudy.next],
  ];
  return (
    <div className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3.5">
      <p className="font-display text-[1rem] font-medium text-[var(--color-shadow)]">{p.title} · case study</p>
      <dl className="mt-3 space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="label-mono text-[0.62rem] text-[var(--color-pine)]">{k}</dt>
            <dd className="mt-0.5 text-[0.86rem] leading-relaxed text-[var(--color-shadow)]">{v}</dd>
          </div>
        ))}
      </dl>
      {p.link && !p.isVirtual && (
        <button
          onClick={() => onAction({ type: "open-link", label: "", href: p.link!.href })}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--color-pine)] hover:text-[var(--color-pine-deep)]"
        >
          Open {p.link.label} <ArrowUpRight size={13} />
        </button>
      )}
    </div>
  );
}

function Chip({
  label,
  onClick,
  block,
  muted,
}: {
  label: string;
  onClick: () => void;
  block?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-sm border px-3 py-2 text-left text-[0.84rem] transition-colors",
        block ? "w-full" : "",
        muted
          ? "border-[var(--color-granite-line)] text-[var(--color-muted)] hover:border-[var(--color-pine)] hover:text-[var(--color-shadow)]"
          : "border-[var(--color-granite-line)] bg-[var(--color-card)] text-[var(--color-shadow)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className="mt-2 inline-flex items-center gap-1 text-[0.66rem] text-[var(--color-muted)] transition-colors hover:text-[var(--color-shadow)]"
      aria-label="Copy answer"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** lightweight streaming reveal; instant under reduced motion */
function StreamedText({ text, animate }: { text: string; animate: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(animate && !reduce ? 0 : text.length);

  useEffect(() => {
    if (!animate || reduce) {
      setN(text.length);
      return;
    }
    const step = Math.max(2, Math.ceil(text.length / 26));
    const t = setInterval(() => {
      setN((cur) => {
        if (cur >= text.length) {
          clearInterval(t);
          return cur;
        }
        return Math.min(text.length, cur + step);
      });
    }, 16);
    return () => clearInterval(t);
  }, [text, animate, reduce]);

  return (
    <div className="space-y-2.5 text-[0.92rem] leading-relaxed text-[var(--color-shadow)]">
      {text
        .slice(0, n)
        .split("\n\n")
        .map((para, i) => (
          <p key={i} className="whitespace-pre-line text-pretty">
            {para}
          </p>
        ))}
    </div>
  );
}
