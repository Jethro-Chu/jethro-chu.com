"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./ABGArena.module.css";

type Tab = "rating" | "accuracy" | "correct" | "survival";
type Row = {
  rank: number; displayName: string; rating: number; accuracy: number; rankedQuestionsAnswered: number;
  rankedQuestionsCorrect: number; bestStreak: number; survivalBest: number;
};

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "rating", label: "ABG Rating" }, { id: "accuracy", label: "Accuracy" },
  { id: "correct", label: "Most Correct" }, { id: "survival", label: "Survival Streak" },
];

export function ABGLeaderboard() {
  const [tab, setTab] = useState<Tab>("rating");
  const [rows, setRows] = useState<Row[]>([]);
  const [current, setCurrent] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    fetch(`/api/abg/leaderboard?tab=${tab}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Leaderboard unavailable.");
        setRows(body.rows); setCurrent(body.currentPlayer);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Leaderboard unavailable."))
      .finally(() => setLoading(false));
  }, [tab]);

  const currentVisible = current && rows.some((row) => row.displayName === current.displayName);
  return (
    <section className={styles.leaderboard}>
      <p className={styles.eyebrow}>GLOBAL STANDINGS</p>
      <div className={styles.boardTitle}><div><h1>Leaderboard</h1><p>Correct interpretation carries more weight than speed. Accuracy requires 50 ranked answers.</p></div><Link href="/ABG" className={styles.primaryButton}>Play ABG Arena</Link></div>
      <div className={styles.boardTabs} role="tablist" aria-label="Leaderboard category">
        {TABS.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? <div className={styles.boardLoading}>Loading current standings…</div> : rows.length === 0 ? <div className={styles.emptyBoard}><strong>No qualifying players yet.</strong><span>Complete a game to set the first mark.</span></div> : (
        <div className={styles.boardTable} aria-label={`${tab} leaderboard`}>
          <div className={styles.boardHead}><span>Rank</span><span>Player</span><span>Rating</span><span>Correct</span><span>Accuracy</span><span>Best streak</span></div>
          {rows.map((row) => <BoardRow key={`${row.rank}-${row.displayName}`} row={row} tab={tab} current={current?.displayName === row.displayName} />)}
        </div>
      )}
      {current && !currentVisible && <div className={styles.yourRow}><span>YOUR POSITION</span><BoardRow row={current} tab={tab} current /></div>}
    </section>
  );
}

function BoardRow({ row, tab, current }: { row: Row; tab: Tab; current?: boolean }) {
  return (
    <div className={styles.boardRow} data-current={current || undefined}>
      <span data-label="Rank">#{row.rank ?? "–"}</span>
      <Link href={`/ABG/player/${encodeURIComponent(row.displayName)}`}>{row.displayName}</Link>
      <span data-label="Rating">{row.rating}</span>
      <span data-label="Correct">{row.rankedQuestionsCorrect}</span>
      <span data-label="Accuracy">{row.rankedQuestionsAnswered ? `${(row.accuracy * 100).toFixed(1)}%` : "–"}</span>
      <span data-label="Best streak">{tab === "survival" ? row.survivalBest : row.bestStreak}</span>
    </div>
  );
}
