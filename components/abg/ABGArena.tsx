"use client";

import { useCallback, useEffect, useState } from "react";
import type { ABGCompensation, ABGDisorder } from "@/lib/abg/types";
import { ClinicalInterventions } from "./ClinicalInterventions";
import styles from "./ABGArena.module.css";

const DISORDERS = ["Normal", "Respiratory Acidosis", "Respiratory Alkalosis", "Metabolic Acidosis", "Metabolic Alkalosis", "Mixed Disorder"] as const;
const COMPENSATIONS = ["Uncompensated", "Partially Compensated", "Fully Compensated", "Mixed / Not Applicable"] as const;
type Disorder = typeof DISORDERS[number];
type Compensation = typeof COMPENSATIONS[number];

type Player = {
  displayName: string; rating: number; rank: number | null; accuracy: number;
  rankedQuestionsAnswered: number; rankedQuestionsCorrect: number; totalQuestionsAnswered: number;
  bestStreak: number; activeSessionId?: string;
};
type Question = { id: string; ph: number; paco2: number; hco3: number; difficulty: string; number: number; total: number | null };
type Session = { id: string; mode: "ranked"; correct: number; incorrect: number; answered: number; total: null; accuracy: number; currentStreak: number; bestStreak: number; averageResponseTimeMs: number; startingRating: number; endingRating: number; ratingChange: number; complete: false; rank: number | null };
type Feedback = {
  correct: boolean; answer: { disorder: ABGDisorder; compensation: ABGCompensation; label: string; explanation: string[] }; yourAnswer: string;
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
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [disorder, setDisorder] = useState<Disorder | null>(null);
  const [compensation, setCompensation] = useState<Compensation | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showRank, setShowRank] = useState(false);

  const refreshPlayer = useCallback(async () => {
    const data = await api<{ player: Player | null }>("/api/abg/player");
    setPlayer(data.player);
  }, []);

  useEffect(() => {
    refreshPlayer().catch(() => setError("Player data is temporarily unavailable.")).finally(() => setLoading(false));
  }, [refreshPlayer]);

  const isSimple = disorder === "Normal" || disorder === "Mixed Disorder";

  const handleSelectDisorder = useCallback((item: Disorder) => {
    setDisorder(item);
    if (item === "Normal" || item === "Mixed Disorder") {
      setCompensation("Mixed / Not Applicable");
    } else if (compensation === "Mixed / Not Applicable") {
      setCompensation(null);
    }
  }, [compensation]);

  const submit = useCallback(async () => {
    const effectiveCompensation = isSimple ? "Mixed / Not Applicable" : compensation;
    if (!session || !question || !disorder || !effectiveCompensation || feedback || busy) return;
    setBusy(true); setError("");
    try {
      const data = await api<Feedback>("/api/abg/attempt", {
        method: "POST", body: JSON.stringify({ sessionId: session.id, questionId: question.id, disorder, compensation: effectiveCompensation }),
      });
      setFeedback(data); setSession(data.session);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not submit answer."); }
    finally { setBusy(false); }
  }, [session, question, disorder, compensation, isSimple, feedback, busy]);

  const continueGame = useCallback(async () => {
    if (!feedback) return;
    setQuestion(feedback.nextQuestion); setFeedback(null); setDisorder(null); setCompensation(null);
  }, [feedback]);

  useEffect(() => {
    if (!question || feedback) return;
    setElapsed(0);
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [question?.id, feedback]);

  useEffect(() => {
    if (screen !== "game") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (feedback) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          continueGame();
        }
        return;
      }
      if (!question) return;
      const number = Number(event.key);
      if (number >= 1 && number <= DISORDERS.length) {
        handleSelectDisorder(DISORDERS[number - 1]);
      }
      if (["q", "w", "e"].includes(event.key.toLowerCase())) {
        const compOptions = ["Uncompensated", "Partially Compensated", "Fully Compensated"] as const;
        const index = ["q", "w", "e"].indexOf(event.key.toLowerCase());
        setCompensation(compOptions[index]);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, feedback, screen, handleSelectDisorder, continueGame, submit]);

  async function createProfile(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = await api<{ player: Player }>("/api/abg/player", { method: "POST", body: JSON.stringify({ displayName: name }) });
      setPlayer(data.player);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create player."); }
    finally { setBusy(false); }
  }

  async function start() {
    setBusy(true); setError("");
    try {
      const data = await api<{ session: Session; question: Question }>("/api/abg/session", {
        method: "POST", body: JSON.stringify({ mode: "ranked" }),
      });
      setSession(data.session); setQuestion(data.question); setFeedback(null); setDisorder(null); setCompensation(null); setShowRank(false); setScreen("game");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not start game."); }
    finally { setBusy(false); }
  }

  async function restore() {
    if (!player?.activeSessionId) return;
    setBusy(true); setError("");
    try {
      const data = await api<{ session: Session; question: Question | null }>(`/api/abg/session?sessionId=${encodeURIComponent(player.activeSessionId)}`);
      setSession(data.session); setQuestion(data.question); setFeedback(null); setScreen("game");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not restore game."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className={styles.loading}>Calibrating ABG Arena…</div>;

  if (!player) {
    return (
      <section className={styles.onboarding}>
        <p className={styles.eyebrow}>NURSING · ACID BASE · SPEED</p>
        <h1>Choose your ABG name</h1>
        <p>Your public display name saves your rating, accuracy, and streaks on this device. No full account is required.</p>
        <form onSubmit={createProfile} className={styles.nameForm}>
          <label htmlFor="abg-name">Ranked display name</label>
          <input id="abg-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={20} autoComplete="nickname" placeholder="Jethro" autoFocus />
          <button className={styles.primaryButton} disabled={busy}>{busy ? "Creating…" : "Start playing"}</button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    );
  }

  if (screen === "game" && session && question) {
    return (
      <section className={styles.game}>
        <div className={styles.gameTop}>
          <div><span>RANKED</span><strong>{session.correct} correct</strong></div>
          <div className={styles.gameControls}>
            <button type="button" className={styles.rankButton} aria-expanded={showRank} onClick={() => setShowRank((visible) => !visible)}>Ranks</button>
            <div className={styles.timer}><span>TIME</span><strong>{elapsed}s</strong></div>
          </div>
        </div>
        {showRank && <div className={styles.rankPeek} role="status"><span>Global rank <strong>{session.rank ? `#${session.rank}` : "Unranked"}</strong></span><span>ABG rating <strong>{session.endingRating}</strong></span></div>}
        <div className={styles.values} aria-label={`pH ${question.ph.toFixed(2)}, PaCO2 ${question.paco2} millimeters of mercury, bicarbonate ${question.hco3} milliequivalents per liter`}>
          <div><span>pH</span><strong>{question.ph.toFixed(2)}</strong><small>7.35–7.45</small></div>
          <div><span>PaCO₂</span><strong>{question.paco2}</strong><small>mmHg</small></div>
          <div><span>HCO₃⁻</span><strong>{question.hco3}</strong><small>mEq/L</small></div>
        </div>

        {feedback ? (
          <div className={`${styles.feedback} ${feedback.correct ? styles.correct : styles.incorrect}`}>
            <p className={styles.feedbackState} role="status" aria-live="polite">{feedback.correct ? "CORRECT" : "INCORRECT"}</p>
            <h2>{feedback.answer.label}</h2>
            {!feedback.correct && <p>Your answer: <strong>{feedback.yourAnswer}</strong></p>}
            <ul>{feedback.answer.explanation.map((line) => <li key={line}>{line}</li>)}</ul>
            <ClinicalInterventions disorder={feedback.answer.disorder} compensation={feedback.answer.compensation} />
            <div className={styles.ratingDelta}><span>ABG rating</span><strong>{feedback.ratingBefore} → {feedback.ratingAfter} <em>{feedback.ratingChange >= 0 ? "+" : ""}{feedback.ratingChange}</em></strong></div>
            <button className={styles.primaryButton} onClick={continueGame}>Next ABG</button>
          </div>
        ) : (
          <div className={styles.answers}>
            <fieldset>
              <legend>1. Identify the primary disorder</legend>
              <div className={styles.answerGrid}>
                {DISORDERS.map((item, index) => (
                  <button
                    type="button"
                    key={item}
                    aria-pressed={disorder === item}
                    onClick={() => handleSelectDisorder(item)}
                  >
                    <kbd>{index + 1}</kbd>{item}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>2. Choose compensation</legend>
              {isSimple ? (
                <div className={styles.compensationNote}>
                  <span><strong>{disorder}</strong> does not have an opposing compensatory response.</span>
                </div>
              ) : (
                <div className={styles.compGrid}>
                  {(["Uncompensated", "Partially Compensated", "Fully Compensated"] as const).map((item, index) => (
                    <button
                      type="button"
                      key={item}
                      aria-pressed={compensation === item}
                      onClick={() => setCompensation(item)}
                    >
                      <kbd>{["Q", "W", "E"][index]}</kbd>{item}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
            <button
              className={styles.primaryButton}
              disabled={!disorder || (!isSimple && !compensation) || busy}
              onClick={submit}
            >
              {busy ? "Checking…" : "Lock in interpretation"}
            </button>
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>ABG INTERPRETATION · CONTINUOUS RANKED PLAY</p>
          <h1>ABG <span>Arena</span></h1>
          <p className={styles.subtitle}>How fast can you interpret an arterial blood gas?</p>
        </div>
        <div className={styles.playerTag}><span>PLAYING AS</span><strong>{player.displayName}</strong></div>
      </section>

      <section className={styles.statsBand} id="ranks" aria-label="Your ABG rating and rank">
        <Stat label="ABG rating" value={player.rating} />
        <Stat label="Global rank" value={player.rank ? `#${player.rank}` : "Unranked"} />
        <Stat label="Accuracy" value={player.rankedQuestionsAnswered ? `${Math.round(player.accuracy * 100)}%` : "New"} />
        <Stat label="Questions" value={player.totalQuestionsAnswered} />
        <Stat label="Best streak" value={player.bestStreak} />
      </section>

      {player.activeSessionId && <div className={styles.resume}><div><span>SESSION FOUND</span><strong>Continue where you left off</strong></div><button onClick={restore} disabled={busy}>Resume</button></div>}

      <section className={styles.modes} aria-labelledby="ranked-mode">
        <p className={styles.eyebrow} id="ranked-mode">RANKED</p>
        <button className={styles.modeRow} onClick={start} disabled={busy}><span className={styles.modeNumber}>R</span><span><strong>Enter ranked</strong><small>Keep interpreting ABGs for as long as you want · Rating updates after every answer</small></span><i>Start</i></button>
      </section>

      <details className={styles.normals}>
        <summary>ABG normal values</summary>
        <div><span>pH <strong>7.35–7.45</strong></span><span>PaCO₂ <strong>35–45 mmHg</strong></span><span>HCO₃⁻ <strong>22–26 mEq/L</strong></span></div>
      </details>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </>
  );
}
