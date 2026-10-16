"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/timeundle/engine";
import { ROUNDS, currentStreak, emojiFor, tierFor, total } from "@/lib/timeundle/engine";
import styles from "./Timeundle.module.css";

function ScoreCounter({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { displayedRef.current = value; setDisplayed(value); return; }
    const start = performance.now();
    const from = displayedRef.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 350);
      const next = Math.round(from + (value - from) * (1 - (1 - t) ** 3));
      displayedRef.current = next;
      setDisplayed(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong aria-label={`${value} points`}><span aria-hidden="true">{displayed.toLocaleString("en-US")}</span><span className={styles.srOnly}>{value} points</span></strong>;
}
export function GameHUD({ game, home, play }: { game: Game; home: () => void; play: (mode: "daily" | "practice") => void }) {
  const streak = currentStreak(game);
  const active = game.phase === "place" ? game.rounds.length : game.rounds.length - 1;
  return <header className={styles.hud}>
    <div className={styles.brandCluster}><button className={styles.brand} onClick={home} aria-label="Timeundle home">timeundle<span>.</span></button>
      <nav className={styles.modeToggle} aria-label="Game mode"><button aria-pressed={game.puzzle.mode === "daily"} onClick={() => play("daily")}>Daily</button><button aria-pressed={game.puzzle.mode === "practice"} onClick={() => play("practice")}>Practice</button></nav>
    </div>
    <div className={styles.roundProgress}><ol className={styles.pips} aria-label="Round progress">{Array.from({ length: ROUNDS }, (_, index) => {
      const round = game.rounds[index];
      return <li key={index} data-tier={round ? tierFor(round) : undefined} data-active={index === active && game.phase !== "complete"} aria-label={`Round ${index + 1}: ${round ? `${emojiFor(tierFor(round))} ${round.points} points` : index === active ? "current" : "upcoming"}`}/>;
    })}</ol><span>{game.phase === "complete" ? "DIVE COMPLETE" : `ROUND ${Math.min(ROUNDS, active + 1)} / 7`}</span></div>
    <div className={styles.hudReadouts}><div className={styles.streak} data-live={streak > 1} key={`streak-${streak}`} aria-label={`${streak} consecutive exact placements`}><span aria-hidden="true">🔥</span> {Math.max(1, streak)}x</div><div className={styles.score}><span>SCORE</span><ScoreCounter key={game.puzzle.id} value={total(game)}/></div></div>
  </header>;
}
