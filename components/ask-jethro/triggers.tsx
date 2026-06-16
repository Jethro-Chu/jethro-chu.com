"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, MessageSquareText } from "./icons";
import { useAskJethro } from "./AskJethro";
import { projectById } from "@/content/profile";

/* the hero command bar — the primary way into the assistant */
const HERO_CHIPS = ["What has he built?", "Why invite him to a hackathon?"];
const chipCls =
  "label-mono rounded-full border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-sand)_60%,transparent)] px-3 py-1 text-[0.66rem] text-[var(--color-muted)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]";

export function HeroCommand() {
  const { ask } = useAskJethro();
  const [v, setV] = useState("");

  return (
    <div className="mx-auto mt-9 w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(v.trim() || "What has Jethro built?");
        }}
        className="group flex items-center gap-2.5 rounded-md border border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(60,64,73,0.04),0_12px_30px_-20px_rgba(60,64,73,0.25)] transition-colors focus-within:border-[var(--color-pine)]"
      >
        <Sparkles size={16} className="shrink-0 text-[var(--color-pine)]" aria-hidden />
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          aria-label="Ask Jethro a question"
          placeholder="Ask what I've built, or why I'd be useful…"
          className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-[var(--color-shadow)] outline-none placeholder:text-[var(--color-muted)]"
        />
        <kbd className="label-mono hidden shrink-0 rounded-xs border border-[var(--color-granite-line)] px-1.5 py-0.5 text-[0.6rem] text-[var(--color-muted)] sm:block">
          ⌘K
        </kbd>
        <button
          type="submit"
          aria-label="Ask Jethro"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[var(--color-pine)] text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
        >
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {HERO_CHIPS.map((q) => (
          <button key={q} onClick={() => ask(q)} className={chipCls}>
            {q}
          </button>
        ))}
        {/* a normal link, not an assistant trigger */}
        <Link href="/resume" className={chipCls}>
          My resume
        </Link>
      </div>
    </div>
  );
}

/* floating launcher, lifted above the mobile elevation bar */
export function FloatingAsk() {
  const { isOpen, open } = useAskJethro();
  if (isOpen) return null;
  return (
    <button
      onClick={open}
      aria-label="Ask Jethro (Command-K)"
      className="fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-[var(--color-granite-line)] bg-[var(--color-card)] px-4 py-2.5 text-[0.85rem] font-medium text-[var(--color-shadow)] shadow-[0_2px_4px_rgba(60,64,73,0.08),0_16px_36px_-18px_rgba(60,64,73,0.4)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)] lg:bottom-6 lg:right-6"
    >
      <MessageSquareText size={16} className="text-[var(--color-pine)]" aria-hidden />
      Ask Jethro
    </button>
  );
}

/* generic "ask the assistant this exact question" chip */
export function AskChip({
  question,
  label,
  primary,
}: {
  question: string;
  label?: string;
  primary?: boolean;
}) {
  const { ask } = useAskJethro();
  return (
    <button
      onClick={() => ask(question)}
      className={
        primary
          ? "inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-pine)] px-3.5 py-2 text-[0.85rem] font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
          : "inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-granite-line)] bg-[var(--color-card)] px-3.5 py-2 text-[0.85rem] font-medium text-[var(--color-shadow)] transition-colors hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]"
      }
    >
      {label ?? question}
      {primary && <ArrowRight size={14} aria-hidden />}
    </button>
  );
}

/* reusable "ask about this project" trigger for cards / sections */
export function AskAboutButton({ projectId, label }: { projectId: string; label?: string }) {
  const { ask } = useAskJethro();
  const p = projectById(projectId);
  if (!p) return null;
  return (
    <button
      onClick={() => ask(`What is ${p.title}?`, { projectId })}
      className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-granite-line)] px-2.5 py-1.5 font-mono text-[0.7rem] text-[var(--color-pine)] transition-colors hover:border-[var(--color-pine)] hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)]"
    >
      <Sparkles size={12} aria-hidden />
      {label ?? "Ask Jethro about this"}
    </button>
  );
}
