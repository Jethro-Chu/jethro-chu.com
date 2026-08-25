"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ABGArena.module.css";

type Profile = {
  displayName: string; rating: number; rank: number | null; accuracy: number; rankedQuestionsAnswered: number;
  rankedQuestionsCorrect: number; bestStreak: number; survivalBest: number; averageResponseTimeMs: number;
  rankedGamesCompleted: number; practiceQuestionsCompleted: number;
  categoryStats: Record<string, { answered: number; correct: number }>;
  ratingHistory: Array<{ rating: number; at: string }>;
};

export function ABGProfile() {
  const params = useParams<{ name: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/abg/profile/${encodeURIComponent(decodeURIComponent(params.name))}`)
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Player not found."); setProfile(body.player); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Player not found."));
  }, [params.name]);

  if (error) return <section className={styles.profile}><p className={styles.error}>{error}</p><Link href="/ABG/leaderboard" className={styles.secondaryButton}>Back to leaderboard</Link></section>;
  if (!profile) return <div className={styles.loading}>Loading ABG profile…</div>;
  const categories = [
    ["Respiratory", profile.categoryStats.respiratory], ["Metabolic", profile.categoryStats.metabolic],
    ["Compensation", profile.categoryStats.compensation], ["Full compensation", profile.categoryStats["full-compensation"]],
  ] as const;
  const recent = profile.ratingHistory.slice(-12);
  const low = Math.min(...recent.map((point) => point.rating), profile.rating);
  const high = Math.max(...recent.map((point) => point.rating), profile.rating);

  return (
    <section className={styles.profile}>
      <Link href="/ABG/leaderboard" className={styles.textButton}>Back to leaderboard</Link>
      <p className={styles.eyebrow}>PLAYER PROFILE</p>
      <div className={styles.profileTitle}><div><h1>{profile.displayName}</h1><p>{profile.rankedQuestionsCorrect} / {profile.rankedQuestionsAnswered} ranked ABGs correct</p></div><div><span>ABG RATING</span><strong>{profile.rating}</strong></div></div>
      <div className={styles.profileStats}>
        <div><span>Global rank</span><strong>{profile.rank ? `#${profile.rank}` : "Unranked"}</strong></div>
        <div><span>Accuracy</span><strong>{profile.rankedQuestionsAnswered ? `${(profile.accuracy * 100).toFixed(1)}%` : "New"}</strong></div>
        <div><span>Best streak</span><strong>{profile.bestStreak}</strong></div>
        <div><span>Average time</span><strong>{profile.averageResponseTimeMs ? `${(profile.averageResponseTimeMs / 1000).toFixed(1)} sec` : "–"}</strong></div>
        <div><span>Ranked games</span><strong>{profile.rankedGamesCompleted}</strong></div>
        <div><span>Survival best</span><strong>{profile.survivalBest}</strong></div>
      </div>
      <div className={styles.profileSections}>
        <section><p className={styles.eyebrow}>CATEGORY PERFORMANCE</p>{categories.map(([label, stat]) => { const percent = stat?.answered ? Math.round(stat.correct / stat.answered * 100) : 0; return <div className={styles.categoryRow} key={label}><span>{label}</span><i><b style={{ width: `${percent}%` }} /></i><strong>{stat?.answered ? `${percent}%` : "No data"}</strong></div>; })}</section>
        <section><p className={styles.eyebrow}>RECENT RATING</p><div className={styles.ratingTrace} aria-label={`Recent rating from ${low} to ${high}`}>{recent.length > 1 ? recent.map((point, index) => { const range = Math.max(1, high - low); const height = 18 + ((point.rating - low) / range) * 62; return <i key={`${point.at}-${index}`} style={{ height }} title={`${point.rating}`} />; }) : <span>Complete ranked questions to build a trend.</span>}</div><div className={styles.traceLabels}><span>{low}</span><span>{high}</span></div></section>
      </div>
      <Link href="/ABG" className={styles.primaryButton}>Play ABG Arena</Link>
    </section>
  );
}

