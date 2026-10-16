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
    if (phase !== "reveal") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setCorrected(true), reduced ? 0 : 1400);
    return () => clearTimeout(timer);
  }, [phase, roundCount, identity]);

  useEffect(() => {
    if (!game || !hydrated.current) return;
    if (justMounted.current) { justMounted.current = false; return; }
    if (game.phase === "reveal") nextRef.current?.focus({ preventScroll: true });
    else titleRef.current?.focus({ preventScroll: true });
  }, [phase, roundCount, identity]); // Selection and clock ticks must never steal focus.

  useLayoutEffect(() => {
    const elements = boardRef.current?.querySelectorAll<HTMLElement>("[data-event]");
    if (!elements) return;
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
  }, [corrected, phase, roundCount, identity]);

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

  return <main id="main" className={styles.root}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/timeundle" aria-label="Timeundle home">
          <svg viewBox="0 0 34 38" fill="none" aria-hidden="true"><path d="M17 2v34M4 8h26M4 30h26" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="19" r="5" fill="currentColor"/><path d="M7 2v5M27 31v5" stroke="currentColor" strokeWidth="2"/></svg>
          <span>timeundle<span className={styles.brandDot}>.</span></span>
        </a>
        <button className={styles.helpButton} onClick={() => helpRef.current?.showModal()} aria-label="How to play">?</button>
      </header>

      <div className={styles.intro}>
        <p className={styles.eyebrow}>A DAILY GAME OF WHEN</p>
        <h1>You know what happened.<br/><span>But do you know when?</span></h1>
        <p>Seven events. One timeline. A few surprises along the way.</p>
      </div>

      <nav className={styles.modeBar} aria-label="Game mode">
        <div className={styles.tabs}>
          <button aria-pressed={game?.puzzle.mode === "daily"} onClick={() => switchMode("daily")} disabled={!game}>Daily</button>
          <button aria-pressed={game?.puzzle.mode === "practice"} onClick={() => switchMode("practice")} disabled={!game}>Practice</button>
        </div>
        <span className={styles.meta}>{game ? game.puzzle.mode === "daily" ? `NO. ${String(puzzleNumber(game.puzzle.date)).padStart(3, "0")} · ${game.puzzle.date}` : "UNLIMITED · JUST FOR FUN" : "LOADING TODAY’S PUZZLE"}</span>
      </nav>
      {storageNotice && <p role="status" className={styles.notice}>{storageNotice}</p>}
      {rolledOver && <div className={styles.notice}>A new UTC day has begun. You can finish this puzzle or <button onClick={() => switchMode("daily")}>play today’s daily</button>.</div>}

      {!game ? <div className={styles.loading} role="status">Setting the timeline…<noscript>Timeundle needs JavaScript to play. Enable it and refresh this page.</noscript></div> : <>
        <div className={styles.scoreBar}>
          <div><span className={styles.meta}>{complete ? "FINAL SCORE" : "YOUR SCORE"}</span><strong>{total(game)}<small> / 700</small></strong></div>
          <div className={styles.progress} aria-label={`${roundCount} of seven events revealed`}>
            <span className={styles.meta}>{complete ? "TIMELINE COMPLETE" : `ROUND ${Math.min(ROUNDS, isReveal ? roundCount : roundCount + 1)} OF 7`}</span>
            <div aria-hidden="true">{Array.from({ length: ROUNDS }, (_, i) => <span key={i} data-done={i < roundCount} data-active={!complete && i === (isReveal ? roundCount - 1 : roundCount)}/>)}</div>
          </div>
        </div>

        <div className={styles.gameGrid}>
          <section className={styles.playPanel} aria-label={complete ? "Game results" : "Current event"}>
            {complete ? <>
              <p className={styles.eyebrow}>{game.puzzle.mode === "daily" ? "TODAY, IN ORDER" : "PRACTICE, IN ORDER"}</p>
              <h2 ref={titleRef} tabIndex={-1} className={styles.resultHeading}>{total(game) === 700 ? "Right on time." : total(game) >= 450 ? "A good sense of time." : "History has its surprises."}</h2>
              <p><span className={styles.numeric}>{exact(game)} / 7</span> placements exactly right. Your complete timeline is ready to explore.</p>
              <ol className={styles.breakdown} aria-label="Round by round results">{game.rounds.map((round, i) => <li key={round.eventId}><span className={styles.meta}>{String(i + 1).padStart(2, "0")}</span><span>{eventFor(round.eventId).title}<small>{round.guessed === round.correct ? "Exact placement" : `${Math.abs(round.guessed - round.correct)} ${Math.abs(round.guessed - round.correct) === 1 ? "slot" : "slots"} away`}</small></span><strong>{round.points}</strong></li>)}</ol>
              <button className={styles.primaryButton} onClick={share}>Share result <span aria-hidden="true">↗</span></button>
              <button className={styles.secondaryButton} onClick={() => switchMode("practice", true)}>Play practice <span aria-hidden="true">→</span></button>
              <p role="status" className={styles.copyStatus}>{copyStatus}</p>
              {fallback && <textarea className={styles.shareFallback} readOnly value={fallback} aria-label="Copy this spoiler-free result" onFocus={(event) => event.currentTarget.select()}/>}
              <p className={styles.legend}>Share key: 🟩 100 · 🟨 75 · 🟧 50 · 🟫 25 · ⬜ 0</p>
              <dl className={styles.stats} aria-label="Your daily statistics">{([["Played", stats.played], ["Streak", stats.streak], ["Best", stats.best], ["Average", stats.average]] as const).map(([label, value]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>
              <p className={styles.smallPrint}>Daily stats stay in this browser. Practice doesn’t count.</p>
            </> : active && <>
              <div className={styles.cardTop}><span className={styles.eyebrow}>{isReveal ? "THE YEAR REVEALED" : "PLACE THIS EVENT"}</span><span className={styles.category}>{active.category}</span></div>
              <div className={styles.currentCard} key={active.id}>
                <div className={styles.yearPlaceholder} aria-label={isReveal ? `Year ${active.year}` : "Year hidden"}>{isReveal ? active.year : <><span aria-hidden="true">? ? ? ?</span><span className={styles.srOnly}>Year hidden</span></>}</div>
                <h2 ref={titleRef} tabIndex={-1}>{active.title}</h2>
                <svg viewBox="0 0 240 20" fill="none" aria-hidden="true"><path d="M0 10h240M32 5v10M72 5v10M112 2v16M152 5v10M192 5v10M232 5v10" stroke="currentColor"/><circle cx="112" cy="10" r="4" fill="currentColor"/></svg>
              </div>
              {isReveal && last ? <div className={styles.reveal} role="status" aria-live="polite" key={`reveal-${active.id}`}>
                <div className={styles.revealHeading}><h3>{last.points === 100 ? "✓ Right on time!" : `${Math.abs(last.guessed - last.correct)} ${Math.abs(last.guessed - last.correct) === 1 ? "slot" : "slots"} away`}</h3><strong>+{last.points} pts</strong></div>
                {last.points !== 100 && <><p className={styles.correctionText}>Your guess: {slotLabel(before, last.guessed)}.</p><p className={styles.correctionText}>{corrected ? "Now in its correct place." : "Your guess is shown on the timeline. Moving it into place…"}</p></>}
                <p>{active.fact}</p>
                <a href={active.source} target="_blank" rel="noopener noreferrer">Read the source <span aria-hidden="true">↗</span></a>
                <button ref={nextRef} className={styles.primaryButton} onClick={advance}>{roundCount === ROUNDS ? "See results" : "Next event"}<span aria-hidden="true">→</span></button>
              </div> : <>
                <p className={styles.instruction}>Where does it belong? Pick a space on the timeline, then lock in your answer.</p>
                <div className={styles.actionDock}>
                <div className={styles.selection} aria-live="polite">{game.selected === null ? "No position selected" : game.selected === 0 ? `Before ${before[0].year}` : game.selected === before.length ? `After ${before.at(-1)!.year}` : `Between ${before[game.selected - 1].year} and ${before[game.selected].year}`}</div>
                <button className={styles.primaryButton} onClick={lockAnswer} disabled={game.selected === null}>Lock it in <span aria-hidden="true">↵</span></button>
                </div>
                <p className={styles.smallPrint}>No timer. Take your time.</p>
              </>}
            </>}
          </section>

          <section className={styles.timelinePanel} aria-label="Your chronological timeline">
            <div className={styles.timelineHeading}><h2>Your timeline</h2><span className={styles.meta}>{displayed.length} EVENTS</span></div>
            <p className={styles.timelineHint}>{complete ? "Every event, in chronological order." : isReveal && !corrected && last?.points !== 100 ? "Your guessed position, before correction." : "Earlier at the top. Later at the bottom."}</p>
            <div className={styles.board} ref={boardRef} role="group" aria-label={complete || isReveal ? "Revealed timeline" : "Choose an insertion position"}>
              <div className={styles.track}>
              <div className={styles.timelineCap}>EARLIER</div>
              {displayed.map((event, index) => <Fragment key={event.id}>
                {phase === "place" && <button className={styles.slot} aria-pressed={game.selected === index} aria-label={`${game.selected === index ? "Selected position" : index === 0 ? "Place before" : "Place here"}: ${slotLabel(before, index)}`} onClick={() => choose(index)}><span aria-hidden="true">{game.selected === index ? "✓" : "+"}</span>{game.selected === index ? "Selected position" : index === 0 ? "Place before" : "Place here"}</button>}
                <div className={styles.timelineEvent} data-event={event.id} data-current={isReveal && event.id === active?.id} data-guessed={isReveal && !corrected && last?.points !== 100 && event.id === active?.id}>
                  <span className={styles.node} aria-hidden="true"/>
                  <div className={styles.eventYear}>{event.year}</div>
                  <div><span className={styles.eventCategory}>{event.category}{isReveal && event.id === active?.id ? corrected || last?.points === 100 ? " · REVEALED" : " · YOUR GUESS" : game.puzzle.anchors.includes(event.id) ? " · STARTER" : ""}</span><h3>{event.title}</h3>{complete && <a className={styles.eventSource} href={event.source} target="_blank" rel="noopener noreferrer">Source ↗</a>}</div>
                </div>
              </Fragment>)}
              {phase === "place" && <button className={styles.slot} aria-pressed={game.selected === before.length} aria-label={`${game.selected === before.length ? "Selected position" : "Place after"}: ${slotLabel(before, before.length)}`} onClick={() => choose(before.length)}><span aria-hidden="true">{game.selected === before.length ? "✓" : "+"}</span>{game.selected === before.length ? "Selected position" : "Place after"}</button>}
              <div className={styles.timelineCap}>LATER</div>
              </div>
            </div>
            <p className={styles.boardNote}>{displayed.length > 4 ? "Scroll the timeline to see every event. " : ""}Spacing shows order, not time elapsed.</p>
          </section>
        </div>
      </>}

      <footer className={styles.footer}><span>A LITTLE HISTORY. EVERY DAY.</span><span>Next daily in <time suppressHydrationWarning>{now ? countdown : "··:··:··"}</time> · 00:00 UTC</span></footer>
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
