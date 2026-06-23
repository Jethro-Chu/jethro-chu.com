"use client";

import { useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "@/components/ask-jethro/icons";
import { fullProjects } from "@/content/profile";
import { AskAboutButton } from "@/components/ask-jethro/triggers";

const studies = fullProjects.filter((p) => !p.isVirtual);

/**
 * Case study explorer — switch between projects and read a short, scannable,
 * honest case study (problem / insight / build / state / next). Client component
 * (the only interactive bit is the project switcher).
 */
export function CaseStudyExplorer() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(studies[0].id);
  const p = studies.find((s) => s.id === active) ?? studies[0];
  const rows: [string, string][] = [
    ["Problem", p.caseStudy.problem],
    ["Insight", p.caseStudy.insight],
    ["What I built", p.caseStudy.build],
    ["State", p.caseStudy.state],
    ["What I'd do next", p.caseStudy.next],
  ];

  return (
    <section
      id="case-studies"
      aria-labelledby="cases-heading"
      className="scroll-mt-6 px-6 py-24 sm:px-10 sm:py-28 lg:pl-16 lg:pr-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="label-mono">Case studies</p>
        <h2 id="cases-heading" className="text-ridge mt-3 text-[var(--color-shadow)]">
          Case study explorer
        </h2>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-[var(--color-muted)]">
          Short, honest write-ups. No invented metrics — where something is a prototype or still in progress, it says so.
        </p>

        <div role="tablist" aria-label="Projects" className="mt-8 flex flex-wrap gap-2">
          {studies.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(s.id)}
                className={[
                  "rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors",
                  on
                    ? "border-[var(--color-pine)] bg-[var(--color-pine)] text-[var(--color-on-dark)]"
                    : "border-[var(--color-granite-line)] text-[var(--color-shadow)] hover:border-[var(--color-pine)] hover:text-[var(--color-pine)]",
                ].join(" ")}
              >
                {s.title}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={active}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0.1 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="font-display text-[1.5rem] font-medium text-[var(--color-shadow)]">{p.title}</h3>
              <span className="label-mono tnum text-[var(--color-pine)]">
                {p.status} · {p.year}
              </span>
            </div>
            <p className="mt-1.5 text-[var(--color-muted)]">{p.subtitle}</p>

            <dl className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="label-mono text-[var(--color-pine)]">{k}</dt>
                  <dd className="mt-1.5 text-pretty leading-relaxed text-[var(--color-shadow)]">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {p.link && !p.isVirtual && (
                <a
                  href={p.link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-pine)] underline decoration-[var(--color-pine)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--color-pine-deep)]"
                >
                  Open {p.link.label}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              )}
              <AskAboutButton projectId={p.id} label="Ask Jethro about this" />
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
