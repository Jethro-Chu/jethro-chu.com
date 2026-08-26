"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./ABGArena.module.css";

type RankRow = {
  rank: number | null;
  displayName: string;
  rating: number;
  accuracy: number;
  rankedQuestionsAnswered: number;
  rankedQuestionsCorrect: number;
  bestStreak: number;
};

export function ABGRanks() {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [current, setCurrent] = useState<RankRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/abg/leaderboard", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { rows?: RankRow[]; currentPlayer?: RankRow | null; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Ranks are unavailable.");
        setRows(body.rows ?? []);
        setCurrent(body.currentPlayer ?? null);
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Ranks are unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const currentVisible = Boolean(current && rows.some((row) => row.displayName === current.displayName));

  return (
    <section className={styles.leaderboard}>
      <p className={styles.eyebrow}>GLOBAL RANKED STANDINGS</p>
      <div className={styles.boardTitle}>
        <div>
          <h1>Ranks</h1>
          <p>Players are ordered by ABG rating. Ratings update after every ranked answer.</p>
        </div>
        <Link href="/ABG" className={styles.primaryButton}>Play ABG Arena</Link>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? (
        <div className={styles.boardLoading} role="status">Loading current standings…</div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyBoard}><strong>No ranked players yet.</strong><span>Answer an ABG to set the first mark.</span></div>
      ) : (
        <div className={styles.boardTable} role="table" aria-label="ABG rating ranks">
          <div className={styles.boardHead} role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Rating</span><span role="columnheader">Correct</span><span role="columnheader">Accuracy</span><span role="columnheader">Best streak</span></div>
          {rows.map((row) => <RankedRow key={`${row.rank}-${row.displayName}`} row={row} current={current?.displayName === row.displayName} />)}
        </div>
      )}

      {current && !currentVisible ? <div className={styles.yourRow}><span>YOUR POSITION</span><RankedRow row={current} current /></div> : null}
    </section>
  );
}

function RankedRow({ row, current = false }: { row: RankRow; current?: boolean }) {
  return (
    <div className={styles.boardRow} role="row" aria-current={current ? "true" : undefined} data-current={current || undefined}>
      <span role="cell" data-label="Rank">#{row.rank ?? "–"}</span>
      <strong role="cell">{row.displayName}</strong>
      <span role="cell" data-label="Rating">{row.rating}</span>
      <span role="cell" data-label="Correct">{row.rankedQuestionsCorrect}</span>
      <span role="cell" data-label="Accuracy">{row.rankedQuestionsAnswered ? `${(row.accuracy * 100).toFixed(1)}%` : "–"}</span>
      <span role="cell" data-label="Best streak">{row.bestStreak}</span>
    </div>
  );
}
