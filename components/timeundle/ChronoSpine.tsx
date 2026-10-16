"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import type { Game } from "@/lib/timeundle/engine";
import { eventFor, tierFor, timeline } from "@/lib/timeundle/engine";
import type { TimelineEvent } from "@/lib/timeundle/events";
import styles from "./Timeundle.module.css";

export function gapLabel(events: TimelineEvent[], slot: number): string {
  if (slot === 0) return `Before ${events[0].year}`;
  if (slot === events.length) return `After ${events.at(-1)!.year}`;
  const a = events[slot - 1].year, b = events[slot].year;
  return `${a} to ${b} · ${b - a} yr gap`;
}
export function ChronoSpine({ game, preview, drop }: { game: Game; preview: (slot: number) => void; drop: (slot: number) => void }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const rects = useRef(new Map<string, DOMRect>());
  const pointer = useRef("");
  const touchArmed = useRef<number | null>(null);
  const mouseAim = useRef<{ slot: number; x: number; y: number } | null>(null);
  const placing = game.phase === "place";
  const events = timeline(game);
  const activeSlot = game.selected ?? Math.floor(events.length / 2);
  const last = game.rounds.at(-1);
  const mystery = game.puzzle.queue[game.rounds.length];
  useLayoutEffect(() => {
    const root = boardRef.current;
    if (!root) return;
    if (!placing) mouseAim.current = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map<string, DOMRect>();
    root.querySelectorAll<HTMLElement>("[data-event]").forEach((element) => {
      const id = element.dataset.event!;
      const rect = element.getBoundingClientRect();
      const previous = rects.current.get(id);
      if (!reduced) {
        if (previous && Math.abs(previous.top - rect.top) > 1) element.animate([{ transform: `translateY(${previous.top - rect.top}px)` }, { transform: "translateY(0)" }], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" });
        else if (!previous && game.phase === "reveal" && id === last?.eventId) element.animate([{ opacity: 0, transform: "translateY(-16px) scale(.96)" }, { opacity: 1, transform: "translateY(2px) scale(1.015)", offset: .72 }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 360, easing: "ease-out" });
      }
      nextRects.set(id, rect);
    });
    rects.current = nextRects;
    const target = placing ? root.querySelector<HTMLElement>(`[data-slot="${activeSlot}"]`) : root.querySelector<HTMLElement>("[data-new=true]");
    if (target) {
      // Scroll only this track. scrollIntoView would move the whole viewport.
      const bounds = root.getBoundingClientRect(), rect = target.getBoundingClientRect();
      if (rect.top < bounds.top + 20) root.scrollTop += rect.top - bounds.top - 20;
      else if (rect.bottom > bounds.bottom - 20) root.scrollTop += rect.bottom - bounds.bottom + 20;
    }
  }, [game.phase, game.rounds.length, activeSlot, last?.eventId, placing]);

  function slot(index: number) {
    const active = index === activeSlot;
    const label = gapLabel(events, index);
    return <button type="button" data-slot={index} data-active={active} className={styles.gap}
      aria-label={`Drop here: ${label}`} aria-pressed={game.selected === index}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        touchArmed.current = null;
        const previous = mouseAim.current;
        // A dock reflow can fire pointerenter without the pointer moving.
        // Keep that original intent instead of aiming at the moving neighbor.
        if (previous && Math.abs(previous.x - event.clientX) < 3 && Math.abs(previous.y - event.clientY) < 3) return;
        mouseAim.current = { slot: index, x: event.clientX, y: event.clientY };
        preview(index);
      }}
      onPointerDown={(event) => { pointer.current = event.pointerType; }}
      onFocus={() => { if (pointer.current !== "touch" && pointer.current !== "pen") preview(index); }}
      onClick={(event) => {
        const touch = pointer.current === "touch" || pointer.current === "pen";
        if (touch && event.detail !== 0 && (touchArmed.current !== index || game.selected !== index)) { touchArmed.current = index; preview(index); }
        else { touchArmed.current = null; drop(index); }
      }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; preview(index); }}
      onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.getData("text/timeundle") === mystery) drop(index); }}>
      <span className={styles.gapMark} aria-hidden="true">{active ? "↓" : "+"}</span>
      <span className={styles.gapSpan}>{label}</span><span className={styles.dropLabel} aria-hidden="true">DROP ↵</span>
    </button>;
  }
  return <section className={styles.spineSection} aria-label="Chronological timeline">
    <div className={styles.trackHeader}><span>CHRONO-SPINE</span><span>{events.length} EVENTS · EARLIEST FIRST</span></div>
    <div ref={boardRef} className={styles.board} data-chrono-track role="group" aria-label={placing ? "Choose an insertion position" : "Revealed timeline"} tabIndex={0}
      onPointerDownCapture={(event) => {
        const aim = mouseAim.current;
        if (!placing || event.pointerType !== "mouse" || event.button !== 0 || !aim || game.selected !== aim.slot) return;
        if (Math.abs(aim.x - event.clientX) >= 3 || Math.abs(aim.y - event.clientY) >= 3) return;
        // Resolve on press at the aimed screen point. Expansion may have moved
        // a node under that point between hover and press; the intended gap wins.
        event.preventDefault();
        mouseAim.current = null;
        drop(aim.slot);
      }}>
      <div className={styles.track}>
        {events.map((event, index) => <Fragment key={event.id}>
          {placing && slot(index)}
          <div data-event={event.id} data-new={game.phase === "reveal" && last?.eventId === event.id} data-tier={game.phase === "reveal" && last?.eventId === event.id ? tierFor(last) : undefined} className={styles.node}>
            <span className={styles.nodeDot} aria-hidden="true"/>
            <span className={styles.year}>{event.year}</span>
            <h3>{event.title}</h3><span className={styles.category}>{event.category}</span>
            {game.phase === "complete" && <a className={styles.nodeSource} href={eventFor(event.id).source} target="_blank" rel="noopener noreferrer" aria-label={`Source for ${event.title}`}>↗</a>}
          </div>
        </Fragment>)}
        {placing && slot(events.length)}
      </div>
    </div>
    <div className={styles.trackFooter}><span>ORDER, NOT DISTANCE</span><span>{placing ? "SCROLL TO EXPLORE ↕" : "TIMELINE SYNCHRONIZED"}</span></div>
  </section>;
}
