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
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowUpRight, Copy, Check, CornerDownLeft } from "./icons";
import { generateJethroAnswer, type AssistantAnswer, type AssistantAction } from "@/lib/askJethro";
import { isOffTopic } from "@/lib/searchIntent";
import { scrollToId } from "@/lib/scrollToId";
import { OffTrailMoment } from "./OffTrailMoment";
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
  | { id: number; role: "casestudy"; projectId: string }
  | { id: number; role: "offtrail" };

type OffTrailAction = "projects" | "resume" | "about";

/* ------------------------------------------------------------------ */
/*  provider (owns state, renders the panel)                          */
/* ------------------------------------------------------------------ */

export function AskJethroProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const nextId = useRef(1);
  const id = () => nextId.current++;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const submit = useCallback(async (question: string, context?: { projectId?: string }) => {
    const text = question.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { id: id(), role: "user", text }]);
    // obvious off-topic asks never reach Gemini — show the off-trail moment instead
    if (isOffTopic(text)) {
      setMessages((m) => [...m, { id: id(), role: "offtrail" }]);
      return;
    }
    setIsThinking(true);

    // the local engine supplies the suggested actions + follow-ups in every case,
    // and the full answer if the Gemini endpoint is unavailable (demo / no key)
    const local = generateJethroAnswer(text, context);
    const started = Date.now();
    let geminiText = "";
    try {
      const res = await fetch("/api/ask-jethro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (res.ok) geminiText = (((await res.json()) as { answer?: string }).answer ?? "").trim();
    } catch {
      /* network error → local fallback below */
    }
    // keep the "thinking" beat from flashing on an instant local fallback
    const elapsed = Date.now() - started;
    if (elapsed < 350) await new Promise((r) => setTimeout(r, 350 - elapsed));

    const answer = geminiText
      ? { intent: "gemini", content: geminiText, relatedProjects: [], followUps: local.followUps, actions: local.actions }
      : local;
    setIsThinking(false);
    setMessages((m) => [...m, { id: id(), role: "assistant", answer, fresh: true }]);
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
        if (action.href.startsWith("/")) {
          // internal route (e.g. /resume): navigate in the same tab
          window.location.assign(action.href);
        } else {
          window.open(action.href, action.href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
        }
      } else if (action.type === "ask" && action.question) {
        submit(action.question);
      } else if (action.type === "view-case-study" && action.projectId) {
        showCaseStudy(action.projectId);
      }
    },
    [submit, showCaseStudy]
  );

  const handleOffTrail = useCallback(
    (a: OffTrailAction) => {
      if (a === "projects") {
        setIsOpen(false);
        // let the panel close before scrolling the page behind it
        window.setTimeout(() => scrollToId("projects"), 380);
      } else if (a === "resume") {
        router.push("/resume");
      } else {
        submit("Tell me about Jethro.");
      }
    },
    [router, submit]
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
        isThinking={isThinking}
        input={input}
        setInput={setInput}
        onSubmit={() => submit(input)}
        onClose={close}
        onAsk={(q) => submit(q)}
        onAction={handleAction}
        onOffTrail={handleOffTrail}
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
  isThinking,
  input,
  setInput,
  onSubmit,
  onClose,
  onAsk,
  onAction,
  onOffTrail,
}: {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onAsk: (q: string) => void;
  onAction: (a: AssistantAction) => void;
  onOffTrail: (a: OffTrailAction) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // whether to keep following the bottom (turns false once the user scrolls up)
  const stick = useRef(true);
  const lastTop = useRef(0);

  const scrollToEnd = useCallback(
    (smooth: boolean) => {
      const el = threadRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [reduce]
  );

  // Only DISENGAGE following on an upward user drag. A programmatic scroll toward
  // the bottom (scrollTop increasing) must never pause auto-follow, otherwise the
  // intermediate scroll events would stop us following streaming text.
  const onThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    const top = el.scrollTop;
    if (top < lastTop.current - 4) stick.current = false;
    if (el.scrollHeight - top - el.clientHeight < 60) stick.current = true;
    lastTop.current = top;
  };

  // focus the input when opened
  useEffect(() => {
    if (isOpen) {
      stick.current = true;
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // a new message / thinking beat follows to the bottom; a fresh user message or
  // the assistant starting to answer always re-engages following
  useEffect(() => {
    if (!isOpen) return;
    const last = messages[messages.length - 1];
    if (last?.role === "user" || isThinking) stick.current = true;
    // instant (not smooth) so it can't conflict with the streaming-follow below
    if (stick.current) scrollToEnd(false);
  }, [messages, isThinking, isOpen, scrollToEnd]);

  // follow the streaming answer as it grows, but only while still sticking.
  // re-runs on open so the observer attaches once the dialog (contentRef) mounts.
  useEffect(() => {
    const content = contentRef.current;
    if (!isOpen || !content) return;
    const ro = new ResizeObserver(() => {
      if (stick.current) scrollToEnd(false);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [scrollToEnd, isOpen]);

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
            data-lenis-prevent
            className="absolute inset-x-0 bottom-0 top-0 flex h-full min-h-0 flex-col border-[var(--color-granite-line)] bg-[var(--color-sand)] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(28rem,100vw)] sm:border-l"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: reduce ? 0.15 : 0.36 }}
            style={{ willChange: "transform" }}
          >
            {/* header */}
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-granite-line)] px-5 py-3.5">
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

            {/* thread — the ONLY scrollable region. min-h-0 lets it shrink so
                overflow scrolling engages; data-lenis-prevent stops the page's
                smooth-scroll from stealing the wheel/touch here. */}
            <div
              ref={threadRef}
              onScroll={onThreadScroll}
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
            >
              <div ref={contentRef} className="space-y-6">
                {messages.length === 0 && !isThinking ? (
                  <EmptyState onAsk={onAsk} />
                ) : (
                  <>
                    {messages.map((m) =>
                      m.role === "user" ? (
                        <UserBubble key={m.id} text={m.text} />
                      ) : m.role === "casestudy" ? (
                        <CaseStudyBlock key={m.id} projectId={m.projectId} onAction={onAction} />
                      ) : m.role === "offtrail" ? (
                        <OffTrailMoment key={m.id} onAction={onOffTrail} />
                      ) : (
                        <AssistantBubble key={m.id} answer={m.answer} fresh={m.fresh} onAsk={onAsk} onAction={onAction} />
                      )
                    )}
                    {isThinking && <Thinking />}
                  </>
                )}
                {/* bottom sentinel for auto-scroll */}
                <div ref={endRef} aria-hidden />
              </div>
            </div>

            {/* input — always visible at the bottom */}
            <form
              className="shrink-0 border-t border-[var(--color-granite-line)] p-3"
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
  const first = profile.name.split(" ")[0];
  return (
    <div className="pt-1">
      <div className="rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3.5">
        <p className="text-[0.92rem] leading-relaxed text-[var(--color-shadow)]">
          Ask me about {first}&apos;s projects, healthcare AI work, his product approach, or what he&apos;s currently building.
        </p>
      </div>
      <p className="label-mono mb-2 mt-5 text-[0.6rem]">try asking</p>
      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((q) => (
          <Chip key={q} label={q} onClick={() => onAsk(q)} />
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div
      className="flex w-fit items-center gap-1.5 rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3.5"
      role="status"
      aria-label="Jethro is thinking"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-[var(--color-muted)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[88%] break-words rounded-md rounded-tr-xs bg-[var(--color-pine)] px-3.5 py-2 text-[0.92rem] leading-relaxed text-[var(--color-on-dark)]">
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
  return (
    <div className="space-y-2.5">
      <div className="max-w-[92%] rounded-md rounded-tl-xs border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-3">
        <FormattedAnswer content={answer.content} animate={fresh} />
        <CopyButton text={answer.content} />
      </div>

      {answer.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {answer.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction(a)}
              className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-sand)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
            >
              {a.label}
              {a.type === "open-link" && <ArrowUpRight size={12} />}
            </button>
          ))}
        </div>
      )}

      {answer.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {answer.followUps.slice(0, 3).map((q) => (
            <Chip key={q} label={q} onClick={() => onAsk(q)} />
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

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3 py-1.5 text-left text-[0.8rem] text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
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

/** lightweight streaming reveal with light formatting; instant under reduced motion */
function FormattedAnswer({ content, animate }: { content: string; animate: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(animate && !reduce ? 0 : content.length);

  useEffect(() => {
    if (!animate || reduce) {
      setN(content.length);
      return;
    }
    const step = Math.max(2, Math.ceil(content.length / 26));
    const t = setInterval(() => {
      setN((cur) => {
        if (cur >= content.length) {
          clearInterval(t);
          return cur;
        }
        return Math.min(content.length, cur + step);
      });
    }, 16);
    return () => clearInterval(t);
  }, [content, animate, reduce]);

  return (
    <div className="space-y-2.5 break-words text-[0.9rem] leading-relaxed text-[var(--color-shadow)]">
      {content
        .slice(0, n)
        .split("\n\n")
        .map((para, i) => (
          <Paragraph key={i} text={para} />
        ))}
    </div>
  );
}

const LABEL = /^(Why it matters|Jethro's role[^:]*):\s+([\s\S]+)$/;

/** render **bold** inline (Gemini answers use markdown); leave the rest as text */
function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-[var(--color-shadow)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

function Paragraph({ text }: { text: string }) {
  if (text.startsWith("• ") || text.includes("\n• ")) {
    return (
      <ul className="space-y-1">
        {text
          .split("\n")
          .filter(Boolean)
          .map((line, i) =>
            line.startsWith("• ") ? (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="text-[var(--color-pine)]">
                  •
                </span>
                <span>{renderInline(line.slice(2))}</span>
              </li>
            ) : (
              <li key={i} className="list-none">
                {renderInline(line)}
              </li>
            )
          )}
      </ul>
    );
  }
  const m = text.match(LABEL);
  if (m) {
    return (
      <p className="text-pretty">
        <span className="font-medium text-[var(--color-shadow)]">{m[1]}:</span>{" "}
        <span className="text-[var(--color-muted)]">{renderInline(m[2])}</span>
      </p>
    );
  }
  return <p className="whitespace-pre-line text-pretty">{renderInline(text)}</p>;
}
