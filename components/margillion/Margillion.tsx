"use client";

import { useEffect, useRef, useState } from "react";
import { bonusOf, emojiFor, estimate, marginOf, pointsOf, puzzleNumber, questionFor, shareText, stats, streakOf, survived, totalOf } from "@/lib/margillion/engine";
import { useMargillion } from "./useMargillion";
import { Clock, NextDaily } from "./Clock";
import styles from "./Margillion.module.css";

const format = (number: number) => number.toLocaleString("en-US", { maximumFractionDigits: 4 });
const pad = (number: number) => String(number).padStart(2, "0");

export default function Margillion() {
  const control = useMargillion();
  const { game, save, ready, today, notice, play, input, lock, next, home } = control;
  const latest = useRef(control); latest.current = control;
  const inputRef = useRef<HTMLInputElement>(null), headingRef = useRef<HTMLHeadingElement>(null), nextRef = useRef<HTMLButtonElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [fallback, setFallback] = useState("");
  const [help, setHelp] = useState(false);
  const roundCount = game?.rounds.length ?? 0, phase = game?.phase, id = game?.id;
  useEffect(() => {
    setCopyStatus(""); setFallback("");
    if (phase === "guess") inputRef.current?.focus({ preventScroll: true });
    else if (phase === "reveal") nextRef.current?.focus({ preventScroll: true });
    else headingRef.current?.focus({ preventScroll: true });
  }, [phase, id, roundCount]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const current = latest.current, value = current.gameRef.current;
      if (!value || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const target = event.target as HTMLElement;
      if (target.closest("textarea, select, a, summary, [contenteditable=true]")) return;
      if (value.phase === "reveal" && ["Enter", " "].includes(event.key)) {
        event.preventDefault(); if (!event.repeat) current.next();
      } else if (value.phase === "guess") {
        if (event.key === "Enter") {
          // Focused action buttons retain their native keyboard activation.
          if (target.closest("button")) return;
          event.preventDefault(); if (!event.repeat) current.lock(event.shiftKey ? "razor" : "safe");
        } else if (!target.closest("input") && /^[0-9.]$/.test(event.key)) {
          event.preventDefault(); current.input(value.input + event.key); inputRef.current?.focus({ preventScroll: true });
        } else if (!target.closest("input") && event.key === "Backspace") {
          event.preventDefault(); current.input(value.input.slice(0, -1));
        }
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  async function share() {
    const current = latest.current.gameRef.current;
    if (!current) return;
    const text = shareText(current);
    try { await navigator.clipboard.writeText(text); setCopyStatus("Result copied."); }
    catch { setFallback(text); setCopyStatus("Select and copy your result below."); }
  }
  function tap(key: string) {
    const current = latest.current.gameRef.current;
    if (!current || current.phase !== "guess") return;
    input(key === "⌫" ? current.input.slice(0, -1) : current.input + key);
    inputRef.current?.focus({ preventScroll: true });
  }
  const daily = save.daily[today], dailyStats = stats(save, today || "2026-10-16");
  const last = game?.rounds.at(-1), margin = game ? marginOf(game) : 100;
  const question = game && game.phase !== "complete" ? questionFor(game, game.phase === "reveal" ? roundCount - 1 : roundCount) : null;
  const delta = last?.delta ?? 0;
  const change = delta >= 0 && (last?.heal ?? 0) > 0 ? "heal" : delta < -20 ? "heavy" : delta < 0 ? "damage" : "steady";
  const dailyLabel = daily?.phase === "complete" ? "View daily result" : daily ? "Resume daily" : "Play daily";

  return <main id="main" data-margillion className={`${styles.root} fixed inset-0 h-dvh w-screen overflow-hidden bg-zinc-950 text-zinc-100`}>
    <div className={styles.shell} data-change={phase === "reveal" ? change : "steady"}>
      <header className={styles.header}>
        <button className={styles.brand} onClick={() => { home(); setHelp(false); }} aria-label="Margillion home">margillion<span>.</span></button>
        <span className={styles.subtitle}>A DAILY GAME OF RAZOR MARGINS</span>
        <span className={styles.edition}>{game?.mode === "practice" ? "ENDLESS / PRACTICE" : `DAILY #${today ? puzzleNumber(game?.date ?? today) : "···"}`}</span>
      </header>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {!game ? <>
        <section className={styles.landing} aria-label="Welcome to Margillion">
          <div className={styles.reticle} aria-hidden="true"><span/><i/><b/></div>
          <p className={styles.eyebrow}>100% MARGIN. ZERO ROOM TO HESITATE.</p>
          <h1 ref={headingRef} tabIndex={-1}>How close<br/> can you cut it<span>?</span></h1>
          <p className={styles.intro}>Ten numbers. Fifteen seconds each.<br/>Trust your gut. Protect your margin.</p>
          <div className={styles.modeSwitch} aria-label="Game mode">
            <button className={styles.play} disabled={!ready} onClick={() => play("daily")}>{ready ? dailyLabel : "Loading…"}<span aria-hidden="true">↗</span></button>
            <button className={styles.practice} disabled={!ready} onClick={() => play("practice", save.practice?.phase === "complete")}>{save.practice && save.practice.phase !== "complete" ? "Resume endless" : "Endless / Practice"}<span aria-hidden="true">∞</span></button>
          </div>
          <button className={styles.helpToggle} aria-expanded={help} aria-controls="margillion-rules" onClick={() => setHelp(!help)}>{help ? "Close rules ↑" : "How to play ↓"}</button>
          {help && <section id="margillion-rules" className={styles.rules} aria-label="How to play">
            <p>Enter an estimate before the 15-second fuse runs out. Every miss costs margin. Reach tier 10 with margin left to survive the daily.</p>
            <p><strong>Safe · Enter:</strong> lose your percentage error, capped at 35. Base points = max(0, round(100 − 2 × error)).</p>
            <p><strong>Razor · Shift + Enter:</strong> within 5.0% earns 3× base points and heals 5 margin. Otherwise, earn base points and lose 2× error, capped at 60.</p>
            <p><strong>Bullseye:</strong> within 1.0% adds 100 points and heals 5. Bonuses stack with Razor; margin caps at 100. Error and margin round to one decimal.</p>
            <p><strong>Timeout:</strong> zero points and −25 margin. Close hits build the displayed streak, with no extra score multiplier. Daily survivors add remaining margin × 10 to their score.</p>
            <p>The fuse keeps running offscreen and after refresh. Reveals advance after 2.8 seconds, or press Space / Enter. Daily resets at midnight UTC; endless is separate practice. Progress and daily stats stay in this browser.</p>
          </section>}
        </section>
        <footer className={styles.landingFooter}><span>SAFE AT 1× <b>OR</b> RISK IT AT 3×</span><NextDaily/></footer>
      </> : <>
        <section className={styles.telemetry} aria-label="Run telemetry">
          <div className={styles.runMeta}><span>TIER <strong>{pad(Math.min(roundCount + (phase === "guess" ? 1 : 0), game.mode === "daily" ? 10 : Infinity))}</strong>{game.mode === "daily" ? " / 10" : " / ∞"}</span><span aria-label={`${streakOf(game)} close-hit streak`}>🔥 {streakOf(game)}x</span><span className={styles.score}>SCORE <strong>{format(phase === "complete" ? totalOf(game) : pointsOf(game))}</strong></span></div>
          <div key={id} className={styles.margin} data-change={phase === "guess" ? "steady" : change}>
            <div className={styles.marginLabel}><span>MARGIN REMAINING</span><strong>{margin.toFixed(1)}<small>%</small></strong></div>
            <div className={styles.marginTrack} role="meter" aria-label="Margin remaining" aria-valuemin={0} aria-valuemax={100} aria-valuenow={margin}><i style={{ transform: `scaleX(${margin / 100})` }} data-low={margin <= 25}/></div>
            <div className={styles.scale} aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
        </section>
        {phase === "complete" ? <section className={styles.results} aria-label="Run results">
          <p className={styles.eyebrow}>{survived(game) ? "DAILY SURVIVED" : "MARGIN DEPLETED"}</p>
          <h1 ref={headingRef} tabIndex={-1}>{survived(game) ? "You made the cut." : "A little too close."}</h1>
          <p className={styles.finalScore}>{format(totalOf(game))}<span>POINTS</span></p>
          <p className={styles.resultSummary}>{margin.toFixed(1)}% margin left · Tier {roundCount}{game.mode === "daily" ? "/10" : ""}{bonusOf(game) ? ` · +${bonusOf(game)} survival bonus` : ""}</p>
          <div className={styles.cells} aria-label="Round results">{game.rounds.slice(-50).map((round, i) => <span key={i} title={`Tier ${game.rounds.length - Math.min(50, game.rounds.length) + i + 1}: ${round.points} points`}>{emojiFor(round)}</span>)}{game.mode === "daily" && Array.from({ length: 10 - roundCount }, (_, i) => <span key={`blank-${i}`}>⬜</span>)}</div>
          <div className={styles.resultActions}><button className={styles.play} onClick={share}>Copy result <span aria-hidden="true">↗</span></button><button className={styles.practice} onClick={() => play("practice", true)}>Play endless <span aria-hidden="true">∞</span></button></div>
          <p className={styles.copyStatus} role="status">{copyStatus}</p>
          {fallback && <textarea className={styles.fallback} readOnly value={fallback} aria-label="Copy this result" onFocus={event => event.currentTarget.select()}/>}
          <details className={styles.breakdown}><summary>Round log & daily stats</summary>
            <dl className={styles.stats}>{([["Daily played", dailyStats.played], ["Survived", dailyStats.wins], ["Win streak", dailyStats.streak], ["Best score", dailyStats.best]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{format(value)}</dd></div>)}</dl>
            <p className={styles.legend}>🎯 Razor lock · 🟩 ≤5% · 🟨 ≤15% · 🟧 ≤30% · 🟥 miss / bust / timeout · 💀 depleted · ⬜ unplayed</p>
            <ol>{game.rounds.map((round, i) => { const item = questionFor(game, i); return <li key={i}><span>{pad(i + 1)} {item.prompt}</span><strong>{round.error === null ? "TIMEOUT" : `${round.error.toFixed(1)}% off`} · {round.points} pts</strong><small>Your estimate: {round.guess === null ? "none" : format(round.guess)} · Actual: {format(item.answer)} {item.unit} · {round.stance}</small><p>{item.fact} {item.source && <a href={item.source} target="_blank" rel="noreferrer">Source ↗</a>}</p></li>; })}</ol>
          </details>
        </section> : question && <>
          <section key={`${id}:${roundCount}:${phase}`} className={styles.chamber} data-change={phase === "reveal" ? change : "steady"} aria-label={phase === "guess" ? "Estimate the number" : "Round reveal"}>
            <Clock deadline={phase === "guess" ? game.deadline : game.revealUntil!} reveal={phase === "reveal"}/>
            <div className={styles.promptTop}><span className={styles.category}>{question.category}</span><span className={styles.difficulty}>LEVEL {question.difficulty}</span></div>
            <h2 className={styles.prompt}>{question.prompt}</h2>
            {phase === "guess" ? <p className={styles.promptHint}>Go with your gut. Enter a number.</p> : last && <div className={styles.reveal} role="status">
              <div className={styles.comparison}><div><span>YOUR ESTIMATE</span><strong>{last.guess === null ? "TIMEOUT" : format(last.guess)}</strong></div><span className={styles.versus}>/</span><div><span>TRUE VALUE · {question.unit}</span><strong className={styles.actual}>{format(question.answer)}</strong></div></div>
              <div className={styles.revealBadges}><span>{last.error === null ? "FUSE EXPIRED" : `OFF BY ${last.error.toFixed(1)}%`}</span><strong data-positive={delta >= 0 && last.heal > 0}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% MARGIN</strong><span>+{last.points} PTS</span></div>
              <p className={styles.verdict} data-win={last.razor || last.bullseye}>{last.bullseye ? "ZERO-MARGIN BULLSEYE" : last.razor ? "RAZOR LOCK" : last.stance === "razor" ? "RAZOR BUST" : last.error === null ? "TOO SLOW" : last.error <= 5 ? "CLEAN LOCK" : "MARGIN CARVED"}{last.bullseye && last.razor ? " · RAZOR LOCK" : ""}</p>
              <p className={styles.fact}>{question.fact}</p>
            </div>}
          </section>
          {phase === "guess" ? <section className={styles.deck} aria-label="Estimate controls">
            <div className={styles.readout}><label htmlFor="estimate">YOUR ESTIMATE</label><div><input ref={inputRef} id="estimate" type="text" inputMode="none" autoComplete="off" maxLength={14} value={game.input} placeholder="0" onChange={event => input(event.target.value)} aria-describedby="estimate-unit"/><span id="estimate-unit">{question.unit}</span></div></div>
            <div className={styles.controls}>
              <div className={styles.keypad} aria-label="Number pad">{["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(key => <button key={key} onClick={() => tap(key)} aria-label={key === "⌫" ? "Backspace" : key === "." ? "Decimal point" : key}>{key}</button>)}</div>
              <div className={styles.locks}><button className={styles.safe} disabled={estimate(game.input) === null} onClick={() => lock("safe")}><span>SAFE LOCK <b>1×</b><kbd>Enter</kbd></span><small>Lose % error from margin</small></button><button className={styles.razor} disabled={estimate(game.input) === null} onClick={() => lock("razor")}><span>RAZOR EDGE <b>3× ⚡</b></span><small>≤5%: 3× points +5 margin<br/>&gt;5%: double damage</small><kbd>Shift + Enter</kbd></button></div>
            </div>
          </section> : <footer className={styles.continueDeck}><span>{margin === 0 ? "NO MARGIN LEFT." : roundCount === 10 && game.mode === "daily" ? "THAT’S YOUR TEN." : "CLOSER IS SAFER."}</span><button ref={nextRef} className={styles.play} onClick={next}>{margin === 0 || (roundCount === 10 && game.mode === "daily") ? "See result" : "Next tier"}<span><kbd>Space / Enter</kbd> →</span></button></footer>}
        </>}
        <footer className={styles.gameFooter}><button onClick={home}>← Menu</button><span>{game.mode === "daily" ? "10 TIERS · ONE SHOT A DAY" : "ENDLESS · DAILY STATS UNAFFECTED"}</span>{today !== game.date && game.mode === "daily" && <button onClick={() => play("daily")}>New daily →</button>}</footer>
      </>}
    </div>
  </main>;
}
