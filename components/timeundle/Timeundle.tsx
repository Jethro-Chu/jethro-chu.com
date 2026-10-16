"use client";

import { useEffect, useRef, useState } from "react";
import { DAY_MS, ROUNDS, currentStreak, emojiFor, exact, maxStreak, puzzleNumber, shareText, statistics, tierFor, timeline, total, utcDate } from "@/lib/timeundle/engine";
import { useTimeundle } from "./useTimeundle";
import { ChronoSpine, gapLabel } from "./ChronoSpine";
import { GameHUD } from "./GameHUD";
import { StageDeck } from "./StageDeck";
import styles from "./Timeundle.module.css";

export default function Timeundle() {
  const control = useTimeundle();
  const { game, save, started, now, notice, canAdvance, play, preview, drop, expire, advance, aimYear, home } = control;
  const controlRef = useRef(control);
  controlRef.current = control;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [snipeOpen, setSnipeOpen] = useState(false);
  const [yearInput, setYearInput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [fallback, setFallback] = useState("");
  const phase = game?.phase;
  const identity = game?.puzzle.id;
  const roundCount = game?.rounds.length ?? 0;
  useEffect(() => {
    setSnipeOpen(false); setYearInput(controlRef.current.game?.snipeYear?.toString() ?? "");
    setCopyStatus(""); setFallback("");
    if (!started || phase !== "reveal") titleRef.current?.focus({ preventScroll: true });
    else nextRef.current?.focus({ preventScroll: true });
  }, [identity, phase, roundCount, started]);

  useEffect(() => { if (started && canAdvance) nextRef.current?.focus({ preventScroll: true }); }, [started, canAdvance]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const current = controlRef.current;
      const value = current.gameRef.current;
      if (!started || !value) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const key = event.key.toLowerCase();
      if (value.phase === "place" && ["arrowup", "arrowdown", "w", "s"].includes(key)) {
        event.preventDefault(); event.stopPropagation();
        const count = timeline(value).length;
        const position = value.selected ?? Math.floor(count / 2);
        current.preview(Math.max(0, Math.min(count, position + (["arrowup", "w"].includes(key) ? -1 : 1))));
      } else if (["enter", " "].includes(key) && !target.closest("button:not([data-slot]), summary, a")) {
        event.preventDefault();
        if (event.repeat) return;
        if (value.phase === "place") current.drop(value.selected ?? Math.floor(timeline(value).length / 2));
        else if (value.phase === "reveal") current.advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

  async function share() {
    const current = control.gameRef.current;
    if (!current) return;
    const text = shareText(current);
    try { await navigator.clipboard.writeText(text); setCopyStatus("Copied. No event spoilers."); }
    catch { setFallback(text); setCopyStatus("Select and copy your result below."); }
  }
  const today = now ? utcDate(now) : "";
  const daily = save.daily[today];
  const stats = statistics(save, today || utcDate());
  const isDailyStarted = daily && (daily.deadlineAt !== null || daily.rounds.length > 0);
  const playLabel = daily?.phase === "complete" ? "View daily result" : isDailyStarted ? "Resume daily dive" : "Play daily dive";
  const remaining = now ? DAY_MS - (now % DAY_MS) : 0;
  const countdown = [Math.floor(remaining / 3_600_000), Math.floor((remaining % 3_600_000) / 60_000), Math.floor((remaining % 60_000) / 1000)].map((n) => String(n).padStart(2, "0")).join(":");
  const rolledOver = game?.puzzle.mode === "daily" && today && game.puzzle.date !== today;
  const last = game?.rounds.at(-1);

  return <main id="main" data-timeundle className={`${styles.root} fixed inset-0 h-dvh overflow-hidden flex flex-col bg-zinc-950 text-zinc-100`}>
    <div className={styles.shell}>
      {started && game ? <>
        <h1 className={styles.srOnly}>Timeundle Chrono-Dive</h1>
        <GameHUD game={game} home={home} play={play}/>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {game.phase === "complete" ? <section className={styles.results} aria-label="Game results">
          <div className={styles.resultHeading}><div><p className={styles.eyebrow}>DIVE COMPLETE</p><h2 ref={titleRef} tabIndex={-1}>{exact(game) === ROUNDS ? "Chronology mastered." : "Back from the dive."}</h2></div><strong>{total(game).toLocaleString("en-US")}<small> PTS</small></strong></div>
          <p className={styles.resultSummary}>{exact(game)}/7 exact · {maxStreak(game)}x max streak · {game.rounds.filter((round) => round.snipe).length} snipes</p>
          <div className={styles.resultGrid} aria-label="Your round results">{game.rounds.map((round, index) => <span key={round.eventId} data-tier={tierFor(round)} aria-label={`Round ${index + 1}: ${round.points} points`}>{emojiFor(tierFor(round))}</span>)}</div>
          <details className={styles.resultDetails}><summary>Round breakdown & daily stats</summary>
            <ol className={styles.breakdown} aria-label="Round by round results">{game.rounds.map((round, index) => <li key={round.eventId}><span>{index + 1}</span><span>{tierFor(round) === "exact" ? "Exact hit" : round.guessed === null ? "No placement" : `${Math.abs(round.guessed - round.correct)} slots off`}{round.speed ? ` · +${round.speed} speed` : ""}{round.multiplier! > 1 ? ` · ${round.multiplier}x` : ""}{round.snipe ? " · Snipe" : ""}</span><strong>{round.points}</strong></li>)}</ol>
            <dl className={styles.dailyStats}>{([["Daily games", stats.played], ["Daily streak", stats.streak], ["Timed best", stats.best], ["Timed average", stats.average]] as const).map(([label, value]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>
          </details>
          {fallback && <textarea className={styles.shareFallback} readOnly value={fallback} aria-label="Copy this spoiler-free result" onFocus={(event) => event.currentTarget.select()}/>}
          {copyStatus && <p className={styles.copyStatus} role="status">{copyStatus}</p>}
        </section> : <StageDeck game={game} expire={expire} titleRef={titleRef} preview={preview} drop={drop}/>}
        <ChronoSpine game={game} preview={preview} drop={drop}/>
        <footer className={styles.actionBar}>
          {game.phase === "complete" ? <div className={styles.resultActions}><button className={styles.primaryButton} onClick={share}>Share result ↗</button><button className={styles.secondaryButton} onClick={() => play("practice", true)}>Dive again →</button></div> : game.phase === "reveal" ? <>
            <p className={styles.dropFeedback}>{last?.guessed === null ? "The fuse ran out. The event is now in order." : last?.guessed === last?.correct ? `${currentStreak(game)}x exact streak. Keep it going.` : "Moved into its true chronological position."}</p>
            <button ref={nextRef} className={styles.primaryButton} disabled={!canAdvance} onClick={advance}>{roundCount === ROUNDS ? "See results" : "Next event"}<span aria-hidden="true"><kbd>Space</kbd> →</span></button>
          </> : <>
            <div className={styles.aimRow}><span className={styles.aimText}>{game.selected === null ? "Aim at a gap. Make the drop." : gapLabel(timeline(game), game.selected)}</span><button className={styles.snipeToggle} aria-expanded={snipeOpen} aria-controls="timeundle-snipe" onClick={() => setSnipeOpen(!snipeOpen)}>⌖ Chrono-snipe <span>+25</span></button></div>
            {snipeOpen && <div id="timeundle-snipe" className={styles.snipeInput}><label htmlFor="snipe-year">Exact year <small>Within 2 years, inside your chosen gap. No extra time.</small></label><input id="snipe-year" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="YYYY" value={yearInput} onChange={(event) => { const raw = event.target.value.replace(/\D/g, "").slice(0, 4); setYearInput(raw); const value = Number(raw); aimYear(raw.length === 4 && value >= 1700 && value <= 2100 ? value : null); }}/></div>}
            <div className={styles.controlsHint}><span className={styles.desktopHint}><kbd>↑</kbd><kbd>↓</kbd> or <kbd>W</kbd><kbd>S</kbd> aim <span>·</span> <kbd>Enter</kbd> drop</span><span className={styles.touchHint}>One tap to aim. A second tap to drop.</span><span>20 SECONDS. ONE SHOT.</span></div>
          </>}
          {rolledOver && <button className={styles.rollover} onClick={() => play("daily")}>A new UTC puzzle is ready. Play today’s daily →</button>}
        </footer>
      </> : <>
        <header className={styles.landingHeader}><span>TIMEUNDLE / CHRONO-DIVE</span><span>DAILY #{today ? puzzleNumber(today) : "··"}</span></header>
        <section className={styles.landing} aria-label="Welcome to Timeundle">
          <svg className={styles.landingMark} viewBox="0 0 160 64" fill="none" aria-hidden="true"><path d="M10 32h140M35 22v20M80 10v44M125 22v20" stroke="currentColor" strokeWidth="1.5"/><circle cx="80" cy="32" r="9" fill="currentColor"/></svg>
          <p className={styles.eyebrow}>THE PAST IS CLOSER THAN YOU THINK</p>
          <h1 ref={titleRef} tabIndex={-1}>timeundle<span>.</span></h1>
          <p className={styles.tagline}>You know what happened.<br/>But do you know when?</p>
          <p className={styles.landingDescription}>Seven drops. Twenty seconds each.<br/>Tighter eras. Higher stakes.</p>
          <div className={styles.startActions}><button className={styles.primaryButton} disabled={!game} onClick={() => play("daily")}>{game ? playLabel : "Preparing timeline…"}<span aria-hidden="true">↓</span></button><button className={styles.secondaryButton} disabled={!game} onClick={() => play("practice")}>{save.practice?.phase === "complete" ? "View practice result" : save.practice ? "Resume practice" : "Practice dive"}<span aria-hidden="true">∞</span></button></div>
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          <details className={styles.help}><summary>How to play</summary><div>
            <p>Put each event into the timeline before its 20-second fuse runs out. Hover or drag to aim, then click once to drop. On touchscreens, tap once to preview a gap and again to commit.</p>
            <p>Use Arrow Up / Down or W / S to aim. Enter or Space drops the card. After the year and fact appear, Space continues. Input fields and buttons keep their normal keyboard behavior.</p>
            <h2>Close counts less on a small board.</h2>
            <ul className={styles.scoring}><li>🟩 Exact: 100 base + up to 30 speed.</li><li>🟨 1 slot off: 40 base in rounds 1–2, then 75. Up to 10 speed.</li><li>🟧 2 slots off: 15 base in rounds 1–3, then 50.</li><li>🟫 3 slots off: 0 base in rounds 1–3, then 25.</li><li>⬜ 4+ slots off or no placement: 0.</li></ul>
            <p>Exact hits build a 1x, 2x, 3x… streak. The multiplier applies to base + speed on that hit. A miss resets it. An optional year guess within 2 years, inside the selected gap, earns a separate +25 Chrono-Snipe bonus.</p>
            <p>At zero, your highlighted slot is submitted with no speed or snipe bonus. If you haven’t aimed, the round scores zero. The fuse keeps running when you leave or refresh. Saved classic rounds keep their original scores.</p>
            <p>Daily is seeded by the UTC date. Practice never affects daily stats. All progress stays in this browser.</p>
          </div></details>
          <p className={styles.arrival}>NEXT DAILY <time>{now ? countdown : "··:··:··"}</time> · 00:00 UTC</p>
        </section>
      </>}
    </div>
  </main>;
}
