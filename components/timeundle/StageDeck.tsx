"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/timeundle/engine";
import { TURN_MS, eventFor, remainingMs, tierFor } from "@/lib/timeundle/engine";
import styles from "./Timeundle.module.css";

function Fuse({ game, expire }: { game: Game; expire: () => void }) {
  const [left, setLeft] = useState(() => remainingMs(game));
  const clockGame = useRef(game);
  clockGame.current = game;
  const expireRef = useRef(expire);
  expireRef.current = expire;
  useEffect(() => {
    function tick() {
      const remaining = remainingMs(clockGame.current);
      setLeft(remaining);
      if (remaining === 0) expireRef.current();
    }
    tick();
    const interval = window.setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [game.deadlineAt]);
  const state = left <= 4000 ? "urgent" : left <= 9000 ? "watch" : "calm";
  return <>
    <div className={styles.fuse} data-state={state} aria-hidden="true"><span style={{ transform: `scaleX(${left / TURN_MS})` }}/></div>
    <time className={styles.clock} data-state={state} aria-label={`${Math.ceil(left / 1000)} seconds remaining`}>{(left / 1000).toFixed(1)}<small>s</small></time>
    <span className={styles.srOnly} role="timer" aria-live="off">{Math.ceil(left / 1000)} seconds remaining</span>
  </>;
}
export function StageDeck({ game, expire, titleRef, preview, drop }: { game: Game; expire: () => void; titleRef: React.RefObject<HTMLHeadingElement | null>; preview: (slot: number) => void; drop: (slot: number) => void }) {
  const drag = useRef<{ x: number; y: number; active: boolean; slot: number | null } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const placing = game.phase === "place";
  const last = game.rounds.at(-1);
  const event = eventFor(placing ? game.puzzle.queue[game.rounds.length] : last!.eventId);
  const tier = last ? tierFor(last) : "miss";
  useEffect(() => { drag.current = null; setGhost(null); }, [game.phase, event.id]);
  return <section className={styles.stage} aria-label="Current event" data-reveal={!placing} data-tier={!placing ? tier : undefined} data-draggable={placing} data-dragging={!!ghost}
    onPointerDown={(pointer) => {
      if (!placing || pointer.pointerType !== "mouse" || pointer.button !== 0) return;
      pointer.preventDefault();
      drag.current = { x: pointer.clientX, y: pointer.clientY, active: false, slot: null };
      pointer.currentTarget.setPointerCapture(pointer.pointerId);
    }}
    onPointerMove={(pointer) => {
      const state = drag.current;
      if (!placing || !state) return;
      if (!state.active && Math.hypot(pointer.clientX - state.x, pointer.clientY - state.y) < 8) return;
      state.active = true;
      setGhost({ x: pointer.clientX, y: pointer.clientY });
      const track = document.querySelector<HTMLElement>("[data-timeundle] [data-chrono-track]");
      if (!track) return;
      const bounds = track.getBoundingClientRect();
      if (pointer.clientX < bounds.left || pointer.clientX > bounds.right || pointer.clientY < bounds.top - 12 || pointer.clientY > bounds.bottom + 12) { state.slot = null; return; }
      if (pointer.clientY > bounds.bottom - 28) track.scrollTop += 16;
      else if (pointer.clientY < bounds.top + 28) track.scrollTop -= 16;
      let closest = Infinity;
      track.querySelectorAll<HTMLElement>("[data-slot]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(pointer.clientY - (rect.top + rect.height / 2));
        if (distance < closest) { closest = distance; state.slot = Number(element.dataset.slot); }
      });
      if (state.slot !== null) preview(state.slot);
    }}
    onPointerUp={(pointer) => {
      const state = drag.current;
      drag.current = null; setGhost(null);
      if (pointer.currentTarget.hasPointerCapture(pointer.pointerId)) pointer.currentTarget.releasePointerCapture(pointer.pointerId);
      if (placing && state?.active && state.slot !== null) drop(state.slot);
    }}
    onPointerCancel={() => { drag.current = null; setGhost(null); }}>
    {ghost && <div className={styles.dragGhost} style={{ left: ghost.x + 12, top: ghost.y + 12 }} aria-hidden="true">{event.title}<span>DROP INTO THE SPINE ↓</span></div>}
    {placing && <Fuse game={game} expire={expire}/>}
    <div className={styles.stageMeta}><span className={styles.category}>{event.category}</span><span>{placing ? "PLACE THIS MOMENT" : `${event.year} · YEAR REVEALED`}</span></div>
    <h2 ref={titleRef} tabIndex={-1}>{event.title}</h2>
    {placing ? <p className={styles.stageHint}><span className={styles.desktopHint}>Hover, drag or use ↑ ↓. Enter to drop.</span><span className={styles.touchHint}>Tap a gap to aim. Tap it again to drop.</span></p> : last && <div className={styles.reveal} role="status" aria-live="polite">
      <div className={styles.verdict}><strong>{last.guessed === null ? "Time’s up. No placement." : tier === "exact" ? "✓ Exact hit" : `${Math.abs(last.guessed - last.correct)} ${Math.abs(last.guessed - last.correct) === 1 ? "slot" : "slots"} off`}</strong><span>+{last.points} PTS</span></div>
      <p className={styles.fact}>{event.fact} <a href={event.source} target="_blank" rel="noopener noreferrer">Source ↗</a></p>
      <p className={styles.scoreMath}>{last.elapsedMs === undefined ? "Saved classic round" : <>{last.base} base{last.speed ? ` + ${last.speed} speed` : ""}{last.multiplier! > 1 ? ` · ${last.multiplier}x streak` : ""}{last.snipe ? " · +25 CHRONO-SNIPE" : last.snipeYear !== null && last.snipeYear !== undefined ? " · SNIPE MISSED" : ""}{last.timedOut ? " · FUSE EXPIRED" : ""}</>}</p>
    </div>}
  </section>;
}
