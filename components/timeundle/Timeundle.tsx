"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Game, Mode, Save } from "@/lib/timeundle/engine";
import { DAY_MS, ROUNDS, STORAGE_KEY, emptySave, emojiFor, eventFor, exact, lock, makePuzzle, newGame, next, parseSave, puzzleNumber, saveGame, shareText, statistics, timeline, total, utcDate } from "@/lib/timeundle/engine";
import styles from "./Timeundle.module.css";

function slotLabel(events: ReturnType<typeof timeline>, slot: number) {
  if (slot === 0) return `Before ${events[0].title} (${events[0].year})`;
  if (slot === events.length) return `After ${events.at(-1)!.title} (${events.at(-1)!.year})`;
  return `Between ${events[slot - 1].title} (${events[slot - 1].year}) and ${events[slot].title} (${events[slot].year})`;
}

export default function Timeundle() {
  const [started, setStarted] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [save, setSave] = useState<Save>(emptySave);
  const [now, setNow] = useState<number | null>(null);
  const [corrected, setCorrected] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [fallback, setFallback] = useState("");
  const gameRef = useRef<Game | null>(null);
  const saveRef = useRef<Save>(emptySave());
  const helpRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, DOMRect>());
  const justMounted = useRef(true);
  const hydrated = useRef(false);

  function showGame(value: Game, data: Save) {
    gameRef.current = value;
    saveRef.current = data;
    setGame(value);
    setSave(data);
    setCopyStatus("");
    setFallback("");
  }
  function commit(value: Game) {
    // Read the latest archive before merging, preserving other tabs’ daily games.
    let latest = saveRef.current;
    try { latest = parseSave(localStorage.getItem(STORAGE_KEY)); } catch { /* memory-only */ }
    const existing = value.puzzle.mode === "daily" ? latest.daily[value.puzzle.date] : latest.practice;
    if (existing?.puzzle.id === value.puzzle.id && (existing.rounds.length > value.rounds.length || existing.phase === "complete")) {
      value = existing;
    }
    const updated = saveGame({ ...latest, daily: { ...saveRef.current.daily, ...latest.daily } }, value);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setStorageNotice("");
    } catch { setStorageNotice("Browser storage is unavailable. You can play, but this session may not survive a refresh."); }
    showGame(value, updated);
  }

  useEffect(() => {
    let data = emptySave();
    try { data = parseSave(localStorage.getItem(STORAGE_KEY)); }
    catch { setStorageNotice("Browser storage is unavailable. Progress will only last for this session."); }
    const today = utcDate();
    const daily = data.daily[today] ?? newGame(makePuzzle(today));
    showGame(data.active === "practice" && data.practice ? data.practice : daily, data);
    setNow(Date.now());
    hydrated.current = true;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const latest = parseSave(event.newValue);
      const current = gameRef.current;
      const restored = current?.puzzle.mode === "daily" ? latest.daily[current.puzzle.date] : latest.practice;
      if (restored && restored.puzzle.id === current?.puzzle.id) showGame(restored, latest);
      else { saveRef.current = latest; setSave(latest); }
    };
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(interval); window.removeEventListener("storage", sync); document.removeEventListener("visibilitychange", tick); };
  }, []);

  const phase = game?.phase;
  const roundCount = game?.rounds.length ?? 0;
  const identity = game?.puzzle.id;
  useEffect(() => {
    setCorrected(false);
    if (!started || phase !== "reveal") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setCorrected(true), reduced ? 0 : 1400);
    return () => clearTimeout(timer);
  }, [phase, roundCount, identity, started]);

  useEffect(() => {
    if (!game || !hydrated.current) return;
    if (justMounted.current) { justMounted.current = false; return; }
    if (!started) titleRef.current?.focus({ preventScroll: true });
    else if (game.phase === "reveal") nextRef.current?.focus({ preventScroll: true });
    else titleRef.current?.focus({ preventScroll: true });
  }, [phase, roundCount, identity, started]); // Selection and clock ticks must never steal focus.

  useLayoutEffect(() => {
    const elements = boardRef.current?.querySelectorAll<HTMLElement>("[data-event]");
    if (!elements) { positions.current.clear(); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextPositions = new Map<string, DOMRect>();
    elements.forEach((element) => {
      const key = element.dataset.event!;
      const rect = element.getBoundingClientRect();
      const previous = positions.current.get(key);
      if (previous && !reduced && previous.top !== rect.top) {
        element.animate([{ transform: `translateY(${previous.top - rect.top}px)` }, { transform: "translateY(0)" }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
      }
      nextPositions.set(key, rect);
    });
    positions.current = nextPositions;
    if (phase === "complete" && boardRef.current) boardRef.current.scrollTop = 0;
    if (phase === "reveal") boardRef.current?.querySelector<HTMLElement>("[data-current=true]")?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [corrected, phase, roundCount, identity, started]);

  function choose(slot: number) {
    const current = gameRef.current;
    if (current?.phase === "place") commit({ ...current, selected: slot });
  }
  function lockAnswer() {
    const current = gameRef.current;
    if (current) commit(lock(current));
  }
  function advance() {
    const current = gameRef.current;
    if (current) commit(next(current));
  }
  function switchMode(mode: Mode, fresh = false) {
    const today = utcDate();
    const stored = mode === "daily" ? saveRef.current.daily[today] : saveRef.current.practice;
    const value = stored && !fresh ? stored : newGame(makePuzzle(today, mode, mode === "daily" ? today : crypto.randomUUID()));
    commit(value);
    setStarted(true);
  }
  async function share() {
    if (!game) return;
    const text = shareText(game);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Result copied. No event spoilers.");
    } catch {
      setFallback(text);
      setCopyStatus("Select and copy the result below.");
    }
  }

  const last = game?.rounds.at(-1);
  const isReveal = phase === "reveal" && !!last;
  const complete = phase === "complete";
  const active = game && !complete ? eventFor(isReveal ? last!.eventId : game.puzzle.queue[roundCount]) : null;
  const before = game ? timeline(game, isReveal ? roundCount - 1 : roundCount) : [];
  const displayed = [...before];
  if (isReveal && active && last) displayed.splice(corrected ? last.correct : last.guessed, 0, active);
  const stats = statistics(save, now ? utcDate(now) : utcDate());
  const remaining = now ? DAY_MS - (now % DAY_MS) : 0;
  const countdown = [Math.floor(remaining / 3_600_000), Math.floor((remaining % 3_600_000) / 60_000), Math.floor((remaining % 60_000) / 1000)].map((n) => String(n).padStart(2, "0")).join(":");
  const rolledOver = game?.puzzle.mode === "daily" && now !== null && game.puzzle.date !== utcDate(now);

  const todayDaily = now ? save.daily[utcDate(now)] : undefined;
  const dailyInProgress = !!todayDaily && (todayDaily.rounds.length > 0 || todayDaily.selected !== null);
  const playLabel = todayDaily?.phase === "complete" ? "View result" : dailyInProgress ? "Continue" : "Play";

  return <main id="main" className={styles.root}>
    <div className={styles.shell}>
      <header className={styles.header}>
        {started ? <button className={styles.brand} onClick={() => setStarted(false)} aria-label="Timeundle home">timeundle<span>.</span></button> : <span className={styles.meta}>A DAILY GAME OF WHEN</span>}
        <button className={styles.helpButton} onClick={() => helpRef.current?.showModal()} aria-label="How to play">?</button>
      </header>
      {storageNotice && <p role="status" className={styles.notice}>{storageNotice}</p>}
      {!started ? <section className={styles.landing} aria-label="Welcome to Timeundle">
        <svg className={styles.landingMark} viewBox="0 0 140 40" fill="none" aria-hidden="true"><path d="M10 20h120" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="20" r="5" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5"/><circle cx="70" cy="20" r="7" fill="currentColor"/><circle cx="125" cy="20" r="5" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5"/></svg>
        <h1 ref={titleRef} tabIndex={-1}>timeundle<span>.</span></h1>
        <p className={styles.tagline}>You know what happened.<br/>But do you know when?</p>
        <p className={styles.landingDescription}>Put seven events in order.<br/>A little history. A few surprises.</p>
        <div className={styles.startActions}>
          <button className={styles.primaryButton} disabled={!game} onClick={() => switchMode("daily")}>{game ? playLabel : "Loading…"}<span aria-hidden="true">→</span></button>
          <button className={styles.textButton} disabled={!game} onClick={() => switchMode("practice")}>{save.practice?.phase === "complete" ? "View practice result" : save.practice ? "Continue practice" : "Play practice"}</button>
        </div>
        <p className={styles.meta}>{now ? `DAILY #${puzzleNumber(utcDate(now))} · ${utcDate(now)}` : "TODAY’S TIMELINE"}</p>
        <p className={styles.arrival}>Next daily in <time>{now ? countdown : "··:··:··"}</time></p>
        <noscript>Enable JavaScript to play Timeundle.</noscript>
      </section> : game && <>
        <h1 className={styles.srOnly}>Timeundle</h1>
        {rolledOver && <div className={styles.notice}>A new UTC day has begun. Finish this puzzle or <button onClick={() => switchMode("daily")}>play today’s daily</button>.</div>}
        <div className={styles.scoreBar}>
          <div className={styles.roundInfo}><span className={styles.meta}>{game.puzzle.mode === "daily" ? `DAILY #${puzzleNumber(game.puzzle.date)}` : "PRACTICE"}</span><span className={styles.round}>{complete ? "Complete" : `${Math.min(ROUNDS, isReveal ? roundCount : roundCount + 1)} / 7`}</span></div>
          <strong aria-label={`${total(game)} out of 700 points`}>{total(game)}<small> / 700</small></strong>
        </div>

        {complete ? <section className={styles.results} aria-label="Game results">
          <h2 ref={titleRef} tabIndex={-1} className={styles.resultHeading}>{total(game) === 700 ? "Right on time." : total(game) >= 450 ? "A good sense of time." : "History has its surprises."}</h2>
          <p><span className={styles.numeric}>{exact(game)} / 7</span> exactly right.</p>
          <button className={styles.primaryButton} onClick={share}>Share result <span aria-hidden="true">↗</span></button>
          <button className={styles.textButton} onClick={() => switchMode("practice", true)}>Play practice</button>
          <p role="status" className={styles.copyStatus}>{copyStatus}</p>
          {fallback && <textarea className={styles.shareFallback} readOnly value={fallback} aria-label="Copy this spoiler-free result" onFocus={(event) => event.currentTarget.select()}/>}
          <details className={styles.details}><summary>Round breakdown</summary>
            <ol className={styles.breakdown} aria-label="Round by round results">{game.rounds.map((round, i) => <li key={round.eventId}><span className={styles.meta}>{i + 1}</span><span>{eventFor(round.eventId).title}<small>{round.guessed === round.correct ? "Exact placement" : `${Math.abs(round.guessed - round.correct)} ${Math.abs(round.guessed - round.correct) === 1 ? "slot" : "slots"} away`}</small></span><strong>{round.points}</strong></li>)}</ol>
            <p className={styles.legend}>Share key: 🟩 100 · 🟨 75 · 🟧 50 · 🟫 25 · ⬜ 0</p>
          </details>
          <details className={styles.details}><summary>Your daily stats</summary>
            <dl className={styles.stats} aria-label="Your daily statistics">{([["Played", stats.played], ["Streak", stats.streak], ["Best", stats.best], ["Average", stats.average]] as const).map(([label, value]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>
            <p className={styles.smallPrint}>Saved in this browser. Practice doesn’t count.</p>
          </details>
        </section> : active && <section className={styles.prompt} aria-label="Current event">
          <p className={styles.meta}>{isReveal ? active.year : "WHERE DOES THIS FIT?"}</p>
          <h2 ref={titleRef} tabIndex={-1}>{active.title}</h2>
        </section>}

        <section className={styles.timelinePanel} aria-label="Your chronological timeline">
          <h2 className={styles.srOnly}>Your timeline</h2>
          <div className={styles.board} ref={boardRef} role="group" aria-label={complete || isReveal ? "Revealed timeline" : "Choose an insertion position"} data-complete={complete}>
            <div className={styles.track}>
              <div className={styles.timelineCap}>EARLIER</div>
              {displayed.map((event, index) => <Fragment key={event.id}>
                {phase === "place" && <button className={styles.slot} aria-pressed={game.selected === index} aria-label={`${game.selected === index ? "Selected position" : "Place here"}: ${slotLabel(before, index)}`} onClick={() => choose(index)}><span aria-hidden="true">{game.selected === index ? "✓" : "+"}</span><span>{game.selected === index ? "Selected position" : "Place here"}</span></button>}
                <div className={styles.timelineEvent} data-event={event.id} data-current={isReveal && event.id === active?.id} data-guessed={isReveal && !corrected && last?.points !== 100 && event.id === active?.id}>
                  <span className={styles.node} aria-hidden="true"/>
                  <div className={styles.eventYear}>{event.year}</div>
                  <div><h3>{event.title}</h3>{isReveal && event.id === active?.id && <span className={styles.eventStatus}>{corrected || last?.points === 100 ? "Revealed" : "Your guess"}</span>}{complete && <a className={styles.eventSource} href={event.source} target="_blank" rel="noopener noreferrer">Source ↗</a>}</div>
                </div>
              </Fragment>)}
              {phase === "place" && <button className={styles.slot} aria-pressed={game.selected === before.length} aria-label={`${game.selected === before.length ? "Selected position" : "Place here"}: ${slotLabel(before, before.length)}`} onClick={() => choose(before.length)}><span aria-hidden="true">{game.selected === before.length ? "✓" : "+"}</span><span>{game.selected === before.length ? "Selected position" : "Place here"}</span></button>}
              <div className={styles.timelineCap}>LATER</div>
            </div>
          </div>
        </section>

        {!complete && <div className={styles.actionDock}>
          {isReveal && last && active ? <>
            <div className={styles.reveal} role="status" aria-live="polite">
              <div className={styles.revealHeading}><h3>{last.points === 100 ? "✓ Right on time!" : `${Math.abs(last.guessed - last.correct)} ${Math.abs(last.guessed - last.correct) === 1 ? "slot" : "slots"} away`}</h3><strong>+{last.points} pts</strong></div>
              <p>{active.fact} <a href={active.source} target="_blank" rel="noopener noreferrer">Source ↗</a></p>
              {last.points !== 100 && <details className={styles.guessDetails}><summary>Your placement</summary><p>Your guess: {slotLabel(before, last.guessed)}. {corrected ? "Now in its correct place." : "Moving it into place…"}</p></details>}
            </div>
            <button ref={nextRef} className={styles.primaryButton} onClick={advance}>{roundCount === ROUNDS ? "See results" : "Next event"}<span aria-hidden="true">→</span></button>
          </> : <>
            <p className={styles.selection} aria-live="polite">{game.selected === null ? "Tap a + to choose a position" : game.selected === 0 ? `Before ${before[0].year}` : game.selected === before.length ? `After ${before.at(-1)!.year}` : `Between ${before[game.selected - 1].year} and ${before[game.selected].year}`}</p>
            <button className={styles.primaryButton} onClick={lockAnswer} disabled={game.selected === null}>Lock it in <span aria-hidden="true">↵</span></button>
          </>}
        </div>}
      </>}
    </div>
    <dialog ref={helpRef} className={styles.dialog} aria-labelledby="timeundle-help" onClick={(event) => { if (event.target === event.currentTarget) helpRef.current?.close(); }}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogHeading}><h2 id="timeundle-help">A matter of time.</h2><button className={styles.helpButton} aria-label="Close help" onClick={() => helpRef.current?.close()}>×</button></div>
        <p>Two events start your timeline. Place seven more, one at a time, from earliest to latest.</p>
        <ol><li>Tap a space before, between or after the events.</li><li>Press <strong>Lock it in</strong> to reveal the year.</li><li>Read the fact, then press <strong>Next event</strong>. Every event stays on the timeline, even after a miss.</li></ol>
        <h3>Close still counts.</h3>
        <p>Distance is measured from the correct space before the event is added. Seven rounds, up to 700 points.</p>
        <ul className={styles.scoring}>{[[100, "Exact"], [75, "1 slot away"], [50, "2 slots away"], [25, "3 slots away"], [0, "4+ slots away"]].map(([points, label]) => <li key={points}><span>{emojiFor(Number(points))} {label}</span><strong>{points} pts</strong></li>)}</ul>
        <p>Daily is the same for everyone and changes at midnight UTC. Practice is unlimited and separate from daily stats. Progress saves in this browser.</p>
        <p>Use Tab to move between spaces, Space or Enter to select, then Tab to <strong>Lock it in</strong>. Escape closes this dialog.</p>
        <button className={styles.primaryButton} onClick={() => helpRef.current?.close()}>Let’s place some history <span aria-hidden="true">→</span></button>
      </div>
    </dialog>
  </main>;
}
