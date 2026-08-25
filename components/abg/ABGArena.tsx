"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./ABGArena.module.css";

const DISORDERS = ["Normal", "Respiratory Acidosis", "Respiratory Alkalosis", "Metabolic Acidosis", "Metabolic Alkalosis", "Mixed Disorder"] as const;
const COMPENSATIONS = ["Uncompensated", "Partially Compensated", "Fully Compensated", "Mixed / Not Applicable"] as const;
type Disorder = typeof DISORDERS[number];
type Compensation = typeof COMPENSATIONS[number];

type Player = {
  displayName: string; rating: number; rank: number | null; accuracy: number;
  rankedQuestionsAnswered: number; rankedQuestionsCorrect: number; totalQuestionsAnswered: number;
  bestStreak: number; survivalBest: number; activeSessionId?: string;
};
type Question = { id: string; ph: number; paco2: number; hco3: number; difficulty: string; number: number; total: number | null };
type Session = { id: string; mode: "ranked" | "practice" | "survival"; correct: number; incorrect: number; answered: number; total: number | null; accuracy: number; currentStreak: number; bestStreak: number; averageResponseTimeMs: number; startingRating: number; endingRating: number; ratingChange: number; complete: boolean; rank: number | null };
type Feedback = {
  correct: boolean; answer: { label: string; explanation: string[] }; yourAnswer: string;
  ratingBefore: number; ratingAfter: number; ratingChange: number; nextQuestion: Question | null; session: Session;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className={styles.stat}><span>{label}</span><strong>{value}</strong></div>;
}

export function ABGArena() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [screen, setScreen] = useState<"home" | "practice" | "game" | "report">("home");
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [disorder, setDisorder] = useState<Disorder | null>(null);
  const [compensation, setCompensation] = useState<Compensation | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "all">("all");
  const [category, setCategory] = useState<"respiratory" | "metabolic" | "compensation" | "all">("all");

  const refreshPlayer = useCallback(async () => {
    const data = await api<{ player: Player | null }>("/api/abg/player");
    setPlayer(data.player);
  }, []);

  useEffect(() => {
    refreshPlayer().catch(() => setError("Player data is temporarily unavailable.")).finally(() => setLoading(false));
  }, [refreshPlayer]);

  useEffect(() => {
    if (!question || feedback) return;
    setElapsed(0);
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [question?.id, feedback]);

  useEffect(() => {
    if (!question || feedback || screen !== "game") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const number = Number(event.key);
      if (number >= 1 && number <= DISORDERS.length) setDisorder(DISORDERS[number - 1]);
      if (["q", "w", "e", "r"].includes(event.key.toLowerCase())) {
        setCompensation(COMPENSATIONS[["q", "w", "e", "r"].indexOf(event.key.toLowerCase())]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, feedback, screen]);

  async function createProfile(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = await api<{ player: Player }>("/api/abg/player", { method: "POST", body: JSON.stringify({ displayName: name }) });
      setPlayer(data.player);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create player."); }
    finally { setBusy(false); }
  }

  async function start(mode: "ranked" | "practice" | "survival") {
    setBusy(true); setError("");
    try {
      const data = await api<{ session: Session; question: Question }>("/api/abg/session", {
        method: "POST", body: JSON.stringify({ mode, difficulty, category }),
      });
      setSession(data.session); setQuestion(data.question); setFeedback(null); setDisorder(null); setCompensation(null); setScreen("game");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not start game."); }
    finally { setBusy(false); }
  }

  async function restore() {
    if (!player?.activeSessionId) return;
    setBusy(true); setError("");
    try {
      const data = await api<{ session: Session; question: Question | null }>(`/api/abg/session?sessionId=${encodeURIComponent(player.activeSessionId)}`);
      setSession(data.session); setQuestion(data.question); setFeedback(null); setScreen(data.session.complete ? "report" : "game");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not restore game."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!session || !question || !disorder || !compensation || feedback) return;
    setBusy(true); setError("");
    try {
      const data = await api<Feedback>("/api/abg/attempt", {
        method: "POST", body: JSON.stringify({ sessionId: session.id, questionId: question.id, disorder, compensation }),
      });
      setFeedback(data); setSession(data.session);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not submit answer."); }
    finally { setBusy(false); }
  }

  async function continueGame() {
    if (!feedback) return;
    if (feedback.session.complete) {
      setSession(feedback.session); setScreen("report"); await refreshPlayer(); return;
    }
    setQuestion(feedback.nextQuestion); setFeedback(null); setDisorder(null); setCompensation(null);
  }

  function returnHome() {
    setScreen("home"); setSession(null); setQuestion(null); setFeedback(null); setError(""); refreshPlayer().catch(() => undefined);
  }

  if (loading) return <div className={styles.loading}>Calibrating ABG Arena…</div>;

  if (!player) {
    return (
      <section className={styles.onboarding}>
        <p className={styles.eyebrow}>NURSING · ACID BASE · SPEED</p>
        <h1>Choose your ABG name</h1>
        <p>Your public display name saves your rating, accuracy, and streaks on this device. No full account is required.</p>
        <form onSubmit={createProfile} className={styles.nameForm}>
          <label htmlFor="abg-name">Leaderboard display name</label>
          <input id="abg-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={20} autoComplete="nickname" placeholder="Jethro" autoFocus />
          <button className={styles.primaryButton} disabled={busy}>{busy ? "Creating…" : "Start playing"}</button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    );
  }

  if (screen === "practice") {
    return (
      <section className={styles.setup}>
        <button className={styles.textButton} onClick={() => setScreen("home")}>Back to arena</button>
        <p className={styles.eyebrow}>PRACTICE SETUP</p>
        <h1>Build one pattern at a time.</h1>
        <fieldset><legend>Difficulty</legend><div className={styles.segmented}>{(["beginner", "intermediate", "all"] as const).map((item) => <button type="button" key={item} aria-pressed={difficulty === item} onClick={() => setDifficulty(item)}>{item}</button>)}</div></fieldset>
        <fieldset><legend>Category</legend><div className={styles.segmented}>{(["respiratory", "metabolic", "compensation", "all"] as const).map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "all" ? "All ABGs" : item}</button>)}</div></fieldset>
        <button className={styles.primaryButton} onClick={() => start("practice")} disabled={busy}>{busy ? "Preparing…" : "Begin practice"}</button>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    );
  }

  if (screen === "game" && session && question) {
    return (
      <section className={styles.game}>
        <div className={styles.gameTop}>
          <div><span>{session.mode === "survival" ? "ABG Survival" : `${session.mode} · ABG ${question.number}${question.total ? ` / ${question.total}` : ""}`}</span><strong>{session.mode === "survival" ? `Streak ${session.currentStreak}` : `${session.correct} correct`}</strong></div>
          <div className={styles.timer}><span>TIME</span><strong>{elapsed}s</strong></div>
        </div>
        <div className={styles.progress} aria-hidden="true"><i style={{ width: question.total ? `${((question.number - 1) / question.total) * 100}%` : `${Math.min(100, session.correct * 4)}%` }} /></div>
        <div className={styles.values} aria-label={`pH ${question.ph.toFixed(2)}, PaCO2 ${question.paco2} millimeters of mercury, bicarbonate ${question.hco3} milliequivalents per liter`}>
          <div><span>pH</span><strong>{question.ph.toFixed(2)}</strong><small>7.35–7.45</small></div>
          <div><span>PaCO₂</span><strong>{question.paco2}</strong><small>mmHg</small></div>
          <div><span>HCO₃⁻</span><strong>{question.hco3}</strong><small>mEq/L</small></div>
        </div>

        {feedback ? (
          <div className={`${styles.feedback} ${feedback.correct ? styles.correct : styles.incorrect}`} role="status" aria-live="polite">
            <p className={styles.feedbackState}>{feedback.correct ? "CORRECT" : "INCORRECT"}</p>
            <h2>{feedback.answer.label}</h2>
            {!feedback.correct && <p>Your answer: <strong>{feedback.yourAnswer}</strong></p>}
            <ul>{feedback.answer.explanation.map((line) => <li key={line}>{line}</li>)}</ul>
            {session.mode === "ranked" && <div className={styles.ratingDelta}><span>ABG rating</span><strong>{feedback.ratingBefore} → {feedback.ratingAfter} <em>{feedback.ratingChange >= 0 ? "+" : ""}{feedback.ratingChange}</em></strong></div>}
            <button className={styles.primaryButton} onClick={continueGame}>{feedback.session.complete ? (session.mode === "survival" ? "See game over" : "See report") : "Next ABG"}</button>
          </div>
        ) : (
          <div className={styles.answers}>
            <fieldset><legend>1. Identify the primary disorder</legend><div className={styles.answerGrid}>{DISORDERS.map((item, index) => <button type="button" key={item} aria-pressed={disorder === item} onClick={() => setDisorder(item)}><kbd>{index + 1}</kbd>{item}</button>)}</div></fieldset>
            <fieldset><legend>2. Choose compensation</legend><div className={styles.compGrid}>{COMPENSATIONS.map((item, index) => <button type="button" key={item} aria-pressed={compensation === item} onClick={() => setCompensation(item)}><kbd>{["Q", "W", "E", "R"][index]}</kbd>{item}</button>)}</div></fieldset>
            <button className={styles.primaryButton} disabled={!disorder || !compensation || busy} onClick={submit}>{busy ? "Checking…" : "Lock in interpretation"}</button>
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    );
  }

  if (screen === "report" && session) {
    const survival = session.mode === "survival";
    return (
      <section className={styles.report}>
        <p className={styles.eyebrow}>{survival ? "GAME OVER" : `${session.mode.toUpperCase()} COMPLETE`}</p>
        <h1>{survival ? `${session.correct} ${session.correct === 1 ? "ABG" : "ABGs"} correct` : `${session.correct} / ${session.answered}`}</h1>
        <p className={styles.reportLead}>{Math.round(session.accuracy * 100)}% accuracy</p>
        <div className={styles.reportGrid}>
          <Stat label={survival ? "Best run" : "Rating"} value={survival ? session.bestStreak : `${session.startingRating} → ${session.endingRating}`} />
          <Stat label="Average time" value={`${(session.averageResponseTimeMs / 1000).toFixed(1)} sec`} />
          <Stat label="Longest streak" value={session.bestStreak} />
          <Stat label="Global rank" value={session.rank ? `#${session.rank}` : "Unranked"} />
        </div>
        <div className={styles.reportActions}>
          <button className={styles.primaryButton} onClick={() => start(session.mode)} disabled={busy}>Play again</button>
          <button className={styles.secondaryButton} onClick={() => setScreen("practice")}>Practice weak areas</button>
          <Link className={styles.secondaryButton} href="/ABG/leaderboard">View leaderboard</Link>
          <button className={styles.textButton} onClick={returnHome}>Return home</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>ABG INTERPRETATION · COMPETITIVE PRACTICE</p>
          <h1>ABG <span>Arena</span></h1>
          <p className={styles.subtitle}>How fast can you interpret an arterial blood gas?</p>
        </div>
        <div className={styles.playerTag}><span>PLAYING AS</span><strong>{player.displayName}</strong></div>
      </section>

      <section className={styles.statsBand} aria-label="Your ABG statistics">
        <Stat label="ABG rating" value={player.rating} />
        <Stat label="Global rank" value={player.rank ? `#${player.rank}` : "Unranked"} />
        <Stat label="Accuracy" value={player.rankedQuestionsAnswered ? `${Math.round(player.accuracy * 100)}%` : "New"} />
        <Stat label="Questions" value={player.totalQuestionsAnswered} />
        <Stat label="Best streak" value={player.bestStreak} />
      </section>

      {player.activeSessionId && <div className={styles.resume}><div><span>SESSION FOUND</span><strong>Continue where you left off</strong></div><button onClick={restore} disabled={busy}>Resume</button></div>}

      <section className={styles.modes} aria-labelledby="choose-mode">
        <p className={styles.eyebrow} id="choose-mode">CHOOSE MODE</p>
        <button className={styles.modeRow} onClick={() => start("ranked")} disabled={busy}><span className={styles.modeNumber}>01</span><span><strong>Ranked</strong><small>20 validated ABGs · Rating on the line</small></span><i>Start</i></button>
        <button className={styles.modeRow} onClick={() => setScreen("practice")}><span className={styles.modeNumber}>02</span><span><strong>Practice</strong><small>Choose your difficulty and clinical pattern</small></span><i>Set up</i></button>
        <button className={styles.modeRow} onClick={() => start("survival")} disabled={busy}><span className={styles.modeNumber}>03</span><span><strong>ABG Survival</strong><small>One wrong answer ends the run</small></span><i>Enter</i></button>
        <Link className={styles.modeRow} href="/ABG/leaderboard"><span className={styles.modeNumber}>04</span><span><strong>Leaderboard</strong><small>Rating · Accuracy · Most correct · Survival</small></span><i>View</i></Link>
      </section>

      <details className={styles.normals}>
        <summary>ABG normal values</summary>
        <div><span>pH <strong>7.35–7.45</strong></span><span>PaCO₂ <strong>35–45 mmHg</strong></span><span>HCO₃⁻ <strong>22–26 mEq/L</strong></span></div>
      </details>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </>
  );
}
