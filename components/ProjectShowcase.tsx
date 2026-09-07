"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "@/components/ask-jethro/icons";

/**
 * A field-guide "browser" showcasing the live projects: switchable tabs (one per
 * project) swap the screenshot in the frame, with the real URL in the address bar
 * and an "Open live" out. Screenshots (not iframes) by design — fast, and it sidesteps
 * X-Frame-Options (lab-logger.com is DENY). Recolored to the Yosemite palette.
 */

interface Shot {
  id: string;
  name: string;
  initial: string;
  url: string;
  href: string;
  blurb: string;
  shot?: string;
  page?: string;
  preview?: "emotion" | "medmath" | "abg";
}

const SHOTS: Shot[] = [
  { id: "medmath", name: "MedMath", initial: "M", url: "jethrochu.com/medmath", href: "/medmath", blurb: "Adult medication math practice for nursing education.", preview: "medmath" },
  { id: "abg-arena", name: "ABG Arena", initial: "A", url: "jethrochu.com/abg", href: "/abg", blurb: "Ranked arterial blood gas interpretation practice.", preview: "abg" },
  { id: "nursejet", name: "NurseJet", initial: "N", url: "nursejet.org", href: "https://nursejet.org", blurb: "Daily clinical briefing for bedside nurses.", shot: "/shots/nursejet.jpg", page: "/projects/nursejet" },
  { id: "lab-logger", name: "Lab Logger", initial: "L", url: "lab-logger.com", href: "https://lab-logger.com", blurb: "The AI lab notebook that writes itself.", shot: "/shots/lab-logger.jpg" },
  { id: "rate-my-hospital-food", name: "Rate My Hospital Food", initial: "R", url: "ratemyhospitalfood.com", href: "https://ratemyhospitalfood.com", blurb: "Reviews for hospital cafeteria food.", shot: "/shots/ratemyhospitalfood.jpg" },
  { id: "emotion", name: "Emotion Stock Market", initial: "E", url: "jethro-chu.github.io", href: "https://jethro-chu.github.io/JethroStockMarketGame.github.io/", blurb: "Your face trades the market.", preview: "emotion", page: "/projects/emotion-stock-market-game" },
];

function MedMathPreview({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden={!active}
      className="absolute inset-0 flex flex-col bg-[#f2ecdc] p-6 text-[#393d49] transition-opacity duration-300 sm:p-9"
      style={{ opacity: active ? 1 : 0 }}
    >
      <div className="flex items-center gap-3 border-b border-[#777b82] pb-4">
        <span className="flex size-10 items-center justify-center rounded-md bg-[#3f654d] font-mono text-sm font-bold text-white">Rx</span>
        <span>
          <strong className="block font-display text-xl leading-none">MedMath</strong>
          <small className="font-mono text-[0.6rem] uppercase tracking-[0.14em]">Adult dosage lab</small>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <span className="mb-3 w-fit rounded-sm bg-[#3f654d] px-2.5 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Clinical dosage laboratory
        </span>
        <strong className="max-w-2xl font-display text-[clamp(1.65rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.035em]">
          Adult Med-Surg &amp; Critical Care Medication Math
        </strong>
        <span className="mt-5 w-fit rounded-sm bg-[#3f654d] px-4 py-2 text-xs font-semibold text-white">Start practicing →</span>
      </div>
    </div>
  );
}

function AbgPreview({ active }: { active: boolean }) {
  const stats = [["ABG rating", "1000"], ["Global rank", "#1"], ["Questions", "0"]];
  return (
    <div
      aria-hidden={!active}
      className="absolute inset-0 flex flex-col bg-[#f7f9f8] p-6 text-[#071812] transition-opacity duration-300 sm:p-9"
      style={{ opacity: active ? 1 : 0 }}
    >
      <div className="flex items-center gap-3 border-b border-[#aab6b1] pb-4">
        <span className="flex size-10 items-end justify-center gap-1 bg-[#075c49] px-2 pb-2">
          {[10, 19, 27].map((height, i) => <i key={height} className={i === 1 ? "w-1 bg-[#ff8a1f]" : "w-1 bg-white"} style={{ height }} />)}
        </span>
        <span>
          <strong className="block font-display text-xl leading-none">ABG Arena</strong>
          <small className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#586760]">Arterial blood gas trainer</small>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#075c49]">Continuous ranked play</span>
        <strong className="mt-2 font-display text-[clamp(2.4rem,7vw,5rem)] leading-none tracking-[-0.06em]">ABG <span className="text-[#087c64]">Arena</span></strong>
        <span className="mt-3 text-base text-[#586760] sm:text-xl">How fast can you interpret an arterial blood gas?</span>
        <div className="mt-6 grid max-w-xl grid-cols-3 border-y border-[#aab6b1]">
          {stats.map(([label, value]) => (
            <span key={label} className="border-r border-[#d6ddda] px-3 py-3 last:border-r-0">
              <small className="block font-mono text-[0.5rem] uppercase tracking-[0.12em] text-[#586760]">{label}</small>
              <b className="mt-1 block font-mono text-lg">{value}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectShowcase() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const a = SHOTS[active];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? (active + 1) % SHOTS.length : (active - 1 + SHOTS.length) % SHOTS.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <figure className="mt-10 sm:mt-12">
      <div className="overflow-hidden rounded-lg border border-[var(--color-granite-line)] bg-[var(--color-card)] shadow-[0_1px_2px_rgba(60,64,73,0.06),0_24px_60px_-28px_rgba(60,64,73,0.4)]">
        {/* tab strip */}
        <div
          role="tablist"
          aria-label="Live project previews"
          onKeyDown={onKey}
          className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--color-granite-line)] bg-[color-mix(in_oklab,var(--color-sand)_70%,var(--color-card))] px-2 pt-2"
        >
          {SHOTS.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.id}
                ref={(el) => { tabsRef.current[i] = el; }}
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-t-md px-3 py-2 text-sm transition-colors",
                  on
                    ? "bg-[var(--color-card)] text-[var(--color-shadow)] shadow-[0_-1px_0_var(--color-granite-line),inset_0_1px_0_var(--color-card)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-shadow)]",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="flex size-5 items-center justify-center rounded-[5px] bg-[var(--color-pine)] font-mono text-[0.62rem] font-semibold text-[var(--color-on-dark)]"
                >
                  {s.initial}
                </span>
                <span className="font-medium">{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* address bar */}
        <div className="flex items-center gap-3 border-b border-[var(--color-granite-line)] px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm bg-[color-mix(in_oklab,var(--color-sand)_60%,var(--color-card))] px-3 py-1.5">
            <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" className="shrink-0">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span className="truncate font-mono text-[0.78rem] text-[var(--color-muted)]">{a.url}</span>
          </div>
          <a
            href={a.href}
            target="_blank"
            rel="noreferrer noopener"
            className="flex shrink-0 items-center gap-1 rounded-sm bg-[var(--color-pine)] px-3 py-1.5 text-xs font-medium text-[var(--color-on-dark)] transition-colors hover:bg-[var(--color-pine-deep)]"
          >
            Open live <ArrowUpRight size={13} aria-hidden />
          </a>
        </div>

        {/* viewport */}
        <div
          role="tabpanel"
          aria-label={`${a.name} preview`}
          className="relative aspect-[16/10] w-full bg-[var(--color-sand)]"
        >
          {SHOTS.map((s, i) =>
            s.preview === "medmath" ? (
              <MedMathPreview key={s.id} active={i === active} />
            ) : s.preview === "abg" ? (
              <AbgPreview key={s.id} active={i === active} />
            ) : s.preview === "emotion" ? (
              <div
                key={s.id}
                aria-hidden={i !== active}
                className="absolute inset-0 flex flex-col justify-between bg-[#0a0a0b] p-6 transition-opacity duration-300 sm:p-8"
                style={{ opacity: i === active ? 1 : 0 }}
              >
                <div className="flex items-center justify-between font-mono text-[0.7rem] tracking-[0.18em] text-[#FFA028]">
                  <span>MARKET PULSE TERMINAL</span>
                  <span className="text-[#3ad17a]">▲ +12.4%</span>
                </div>
                <div className="flex items-end gap-1.5">
                  {[34, 52, 41, 68, 49, 77, 58, 88, 64, 96, 72, 84].map((h, k) => (
                    <span key={k} className="w-2 rounded-[1px]" style={{ height: h, background: k % 3 === 0 ? "#e5484d" : "#3ad17a" }} />
                  ))}
                </div>
                <p className="font-mono text-[0.82rem] text-[#FFA028]">Your face trades the market.</p>
              </div>
            ) : (
              <Image
                key={s.id}
                src={s.shot!}
                alt={`${s.name} screenshot`}
                fill
                sizes="(min-width: 1024px) 760px, 92vw"
                className="object-cover object-top transition-opacity duration-300"
                style={{ opacity: i === active ? 1 : 0 }}
                aria-hidden={i !== active}
              />
            )
          )}
        </div>
      </div>

      {/* caption */}
      <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <p className="text-[var(--color-muted)]">
          <span className="font-display font-medium text-[var(--color-shadow)]">{a.name}.</span> {a.blurb}
        </p>
        <p className="label-mono">hover a tab to switch · click Open live to visit</p>
      </figcaption>
    </figure>
  );
}
