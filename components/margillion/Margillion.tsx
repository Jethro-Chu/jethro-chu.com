"use client";

import { useEffect, useRef, useState } from "react";
import { bonusOf, emojiFor, estimate, marginOf, pointsOf, puzzleNumber, questionFor, shareText, stats, streakOf, survived, totalOf } from "@/lib/margillion/engine";
import { useMargillion } from "./useMargillion";
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
  const helpRef = useRef(help); helpRef.current = help;
  const helpHeadingRef = useRef<HTMLHeadingElement>(null);
  const roundCount = game?.rounds.length ?? 0, phase = game?.phase, id = game?.id;
  useEffect(() => {
    setCopyStatus(""); setFallback("");
    if (help) helpHeadingRef.current?.focus({ preventScroll: true });
    else if (phase === "guess") inputRef.current?.focus({ preventScroll: true });
    else if (phase === "reveal") nextRef.current?.focus({ preventScroll: true });
    else headingRef.current?.focus({ preventScroll: true });
  }, [phase, id, roundCount, help]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const current = latest.current, value = current.gameRef.current;
      if (event.key === "Escape" && helpRef.current) { setHelp(false); return; }
      if (helpRef.current || !value || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const target = event.target as HTMLElement;
      if (target.closest("textarea, select, a, summary, [contenteditable=true]")) return;
      if (value.phase === "reveal" && ["Enter", " "].includes(event.key)) {
        if (target.closest("button:not([data-next])")) return;
        event.preventDefault(); if (!event.repeat) current.next();
      } else if (value.phase === "guess") {
        if (event.key === "Enter") {
          const button = target.closest("button");
          if (button && !button.hasAttribute("data-lock")) return;
          event.preventDefault();
          if (!event.repeat) current.lock(event.shiftKey || button?.getAttribute("data-lock") === "razor" ? "razor" : "safe");
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
  const daily = save.daily[today], dailyStats = stats(save, today || "2026-10-16");
  const last = game?.rounds.at(-1), margin = game ? marginOf(game) : 100;
  const question = game && game.phase !== "complete" ? questionFor(game, game.phase === "reveal" ? roundCount - 1 : roundCount) : null;
  const delta = last?.delta ?? 0;
  const dailyLabel = daily?.phase === "complete" ? "View daily result" : daily ? "Resume daily" : "Play daily";

  return <main id="main" data-margillion className={`${styles.root} fixed inset-0 h-dvh w-screen overflow-hidden bg-zinc-950 text-zinc-100`}>
    <section className={styles.desktopNotice} aria-label="Desktop required"><span className={styles.brand}>margillion<span>.</span></span><h1>Made for your keyboard.</h1><p>Open Margillion on a desktop with a physical keyboard.</p><p>Type your estimate. Enter to lock. Shift + Enter to risk it.</p></section>
    <div className={styles.shell}>
      <header className={styles.header}>
        <button className={styles.brand} onClick={() => { home(); setHelp(false); }} aria-label="Margillion home">margillion<span>.</span></button>
        <span className={styles.edition}>{game?.mode === "practice" ? "ENDLESS" : `DAILY #${today ? puzzleNumber(game?.date ?? today) : "···"}`}</span>
        <nav className={styles.headerActions} aria-label="Game navigation">
          <button aria-expanded={help} aria-controls="margillion-rules" onClick={() => setHelp(!help)}>How to play</button>
          <button onClick={() => { home(); setHelp(false); }}>Mode</button>
        </nav>
      </header>
      {help && <section id="margillion-rules" className={styles.rules} aria-label="How to play">
        <div className={styles.rulesHeading}><h2 ref={helpHeadingRef} tabIndex={-1}>How to play</h2><button onClick={() => setHelp(false)}>Close <kbd>Esc</kbd></button></div>
        <p>Take your time with each estimate. Every miss costs margin. Survive ten tiers to finish the daily.</p>
        <p><strong>Safe · Enter:</strong> lose your percentage error, capped at 35. Base points = max(0, round(100 − 2 × error)).</p>
        <p><strong>Razor · Shift + Enter:</strong> within 5.0% earns 3× base points and heals 5 margin. Otherwise, earn base points and lose 2× error, capped at 60.</p>
        <p><strong>Bullseye:</strong> within 1.0% adds 100 points and heals 5. Bonuses stack; margin caps at 100. Error and margin round to one decimal.</p>
        <p>Close hits build a streak, with no extra multiplier. Daily survivors add remaining margin × 10. There is no time limit or timeout penalty.</p>
        <p>Reveals advance after 2.8 seconds, or press Space / Enter. Your estimate stays saved when you leave or refresh. Daily resets at midnight UTC. Endless practice has separate progress.</p>
      </section>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {!game ? <>
        <section className={styles.landing} aria-label="Welcome to Margillion">
          <div className={styles.reticle} aria-hidden="true"><span/><i/><b/></div>
          <p className={styles.eyebrow}>100% MARGIN. CHOOSE YOUR RISK.</p>
          <h1 ref={headingRef} tabIndex={-1}>How close<br/> can you cut it<span>?</span></h1>
          <p className={styles.intro}>Ten numbers. Take your time.<br/>Trust your gut. Protect your margin.</p>
          <div className={styles.modeSwitch} aria-label="Game mode">
            <button className={styles.play} disabled={!ready} onClick={() => play("daily")}>{ready ? dailyLabel : "Loading…"}<span aria-hidden="true">↗</span></button>
            <button className={styles.practice} disabled={!ready} onClick={() => play("practice", save.practice?.phase === "complete")}>{save.practice && save.practice.phase !== "complete" ? "Resume endless" : "Endless / Practice"}<span aria-hidden="true">∞</span></button>
          </div>
        </section>
        <footer className={styles.landingFooter}><span>SAFE AT 1× <b>OR</b> RISK IT AT 3×</span><span>NEW DAILY AT 00:00 UTC</span></footer>
      </> : <>
        <div className={styles.playArea}>
        <section className={styles.telemetry} aria-label="Run telemetry">
          <div className={styles.telemetryRow}>
            <div className={styles.runMeta}>
              <span>TIER <strong>{pad(Math.min(roundCount + (phase === "guess" ? 1 : 0), game.mode === "daily" ? 10 : Infinity))}{game.mode === "daily" ? "/10" : "/∞"}</strong></span>
              <span>SCORE <strong>{format(phase === "complete" ? totalOf(game) : pointsOf(game))}</strong></span>
              {streakOf(game) >= 2 && <span className={styles.streak} aria-label={`${streakOf(game)} close-hit streak`}>🔥 {streakOf(game)}x</span>}
            </div>
            <p className={styles.marginLabel}><strong>{margin.toFixed(1)}%</strong> MARGIN</p>
          </div>
          <div className={styles.marginTrack} role="meter" aria-label="Margin remaining" aria-valuemin={0} aria-valuemax={100} aria-valuenow={margin}><i style={{ transform: `scaleX(${margin / 100})` }} data-state={margin > 60 ? "normal" : margin >= 25 ? "watch" : "critical"}/></div>
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
            <p className={styles.legend}>🎯 Razor lock · 🟩 ≤5% · 🟨 ≤15% · 🟧 ≤30% · 🟥 miss / bust · 💀 depleted · ⬜ unplayed</p>
            <ol>{game.rounds.map((round, i) => { const item = questionFor(game, i); return <li key={i}><span>{pad(i + 1)} {item.prompt}</span><strong>{round.error === null ? "TIMEOUT" : `${round.error.toFixed(1)}% off`} · {round.points} pts</strong><small>Your estimate: {round.guess === null ? "none" : format(round.guess)} · Actual: {format(item.answer)} {item.unit} · {round.stance}</small><p>{item.fact} {item.source && <a href={item.source} target="_blank" rel="noreferrer">Source ↗</a>}</p></li>; })}</ol>
          </details>
        </section> : question && <section className={styles.chamber} aria-label={phase === "guess" ? "Estimate the number" : "Round reveal"}>
          <div className={styles.promptTop}><span className={styles.category}>{question.category}</span></div>
          <h2 className={styles.prompt}>{question.prompt}</h2>
          {phase === "guess" ? <div className={styles.answerArea}>
            <div className={styles.readout}>
              <label className={styles.srOnly} htmlFor="estimate">Your estimate</label>
              <div className={styles.readoutRow}>
                <input ref={inputRef} id="estimate" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} maxLength={14} value={game.input} placeholder="0" style={{ width: `${Math.max(1, game.input.length)}ch` }} onChange={event => input(event.target.value)} aria-describedby="estimate-unit"/>
                <span id="estimate-unit">{question.unit}</span>
              </div>
            </div>
            <div className={styles.locks} aria-label="Lock your estimate">
              <button className={styles.safe} data-lock="safe" disabled={estimate(game.input) === null} onClick={() => lock("safe")}>
                <span className={styles.lockTitle}><strong>Safe Lock</strong><kbd>Enter ↵</kbd></span>
                <small>1× · −% error</small>
              </button>
              <button className={styles.razor} data-lock="razor" disabled={estimate(game.input) === null} onClick={() => lock("razor")}>
                <span className={styles.lockTitle}><strong>Razor 3× ⚡</strong><kbd>Shift + Enter</kbd></span>
                <small>≤5%: +5% margin · &gt;5%: 2× damage</small>
              </button>
            </div>
          </div> : last && <div key={`${id}:${roundCount}`} className={styles.reveal} role="status">
            <div className={styles.comparison}>
              <div><span>YOUR GUESS</span><strong>{last.guess === null ? "TIMEOUT" : format(last.guess)}</strong></div>
              <div><span>ACTUAL · {question.unit}</span><strong className={styles.actual}>{format(question.answer)}</strong></div>
              <div><span>ERROR / MARGIN</span><strong>{last.error === null ? "TIMEOUT" : `${last.error.toFixed(1)}%`}</strong><small data-positive={delta >= 0 && last.heal > 0}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% margin</small></div>
            </div>
            <p className={styles.verdict} data-win={last.razor || last.bullseye}>{last.bullseye ? "ZERO-MARGIN BULLSEYE" : last.razor ? "RAZOR LOCK" : last.stance === "razor" ? "RAZOR BUST" : last.error === null ? "TOO SLOW" : last.error <= 5 ? "CLEAN LOCK" : "MARGIN CARVED"}{last.bullseye && last.razor ? " · RAZOR LOCK" : ""}<span>+{last.points} pts</span></p>
            <p className={styles.fact}>{question.fact}</p>
            <button ref={nextRef} data-next className={styles.nextPrompt} onClick={next}>Press <kbd>Space</kbd> or <kbd>Enter</kbd> for {margin === 0 || (roundCount === 10 && game.mode === "daily") ? "your result" : "next tier"} →</button>
          </div>}
        </section>}
        </div>
        <footer className={styles.gameFooter}><span>{game.mode === "daily" ? "10 TIERS · ONE SHOT A DAY" : "ENDLESS · DAILY STATS UNAFFECTED"}</span>{today !== game.date && game.mode === "daily" && <button onClick={() => play("daily")}>New daily →</button>}</footer>
      </>}
    </div>
  </main>;
}
