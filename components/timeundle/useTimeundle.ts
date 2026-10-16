"use client";

import { useEffect, useRef, useState } from "react";
import { STORAGE_KEY, emptySave, lock, makePuzzle, newGame, next, parseSave, remainingMs, saveGame, startRound, utcDate } from "@/lib/timeundle/engine";
import type { Game, Mode, Save } from "@/lib/timeundle/engine";

export function useTimeundle() {
  const [game, setGame] = useState<Game | null>(null);
  const [save, setSave] = useState<Save>(emptySave);
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [canAdvance, setCanAdvance] = useState(false);
  const gameRef = useRef<Game | null>(null);
  const saveRef = useRef<Save>(emptySave());
  const actionAt = useRef(0);

  function display(value: Game, data: Save) {
    gameRef.current = value; saveRef.current = data;
    setGame(value); setSave(data);
  }
  function persist(value: Game, guard = false) {
    if (guard) {
      try {
        const latest = parseSave(localStorage.getItem(STORAGE_KEY));
        const existing = value.puzzle.mode === "daily" ? latest.daily[value.puzzle.date] : latest.practice;
        if (existing?.puzzle.id === value.puzzle.id && (existing.rounds.length > value.rounds.length || existing.phase === "complete")) {
          value = existing;
        }
        saveRef.current = { ...saveRef.current, daily: { ...saveRef.current.daily, ...latest.daily } };
      } catch { /* A blocked browser storage still permits in-memory play. */ }
    }
    const updated = saveGame(saveRef.current, value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); }
    catch { setNotice("Browser storage is unavailable. Progress lasts for this session only."); }
    display(value, updated);
  }
  function expire() {
    const current = gameRef.current;
    if (current?.phase === "place" && current.deadlineAt !== null && remainingMs(current) === 0) {
      actionAt.current = Date.now();
      persist(lock(current, Date.now(), true), true);
    }
  }
  useEffect(() => {
    let data = emptySave();
    try { data = parseSave(localStorage.getItem(STORAGE_KEY)); }
    catch { setNotice("Browser storage is unavailable. Progress lasts for this session only."); }
    const today = utcDate();
    const current = data.active === "practice" && data.practice ? data.practice : data.daily[today] ?? newGame(makePuzzle(today));
    display(current, data);
    setNow(Date.now());
    expire();
    const interval = window.setInterval(() => { setNow(Date.now()); expire(); }, 1000);
    const onVisible = () => { setNow(Date.now()); expire(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const latest = parseSave(event.newValue);
      const value = gameRef.current;
      const restored = value?.puzzle.mode === "daily" ? latest.daily[value.puzzle.date] : latest.practice;
      if (restored && restored.puzzle.id === value?.puzzle.id) display(restored, latest);
      else { saveRef.current = latest; setSave(latest); }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    setCanAdvance(false);
    if (game?.phase !== "reveal") return;
    const timer = window.setTimeout(() => setCanAdvance(true), 240);
    return () => clearTimeout(timer);
  }, [game?.phase, game?.rounds.length, game?.puzzle.id]);

  function play(mode: Mode, fresh = false) {
    const today = utcDate();
    let latest = saveRef.current;
    try { latest = parseSave(localStorage.getItem(STORAGE_KEY)); } catch { /* memory only */ }
    saveRef.current = latest;
    const stored = mode === "daily" ? latest.daily[today] : latest.practice;
    let value = stored && !fresh ? stored : newGame(makePuzzle(today, mode, mode === "daily" ? today : crypto.randomUUID()));
    value = startRound(value);
    if (value.phase === "place" && remainingMs(value) === 0) value = lock(value, Date.now(), true);
    persist(value, true);
    setStarted(true);
    actionAt.current = Date.now();
  }
  function preview(slot: number) {
    const current = gameRef.current;
    if (!current || current.phase !== "place" || current.selected === slot) return;
    if (remainingMs(current) === 0) { expire(); return; }
    persist({ ...current, selected: slot });
  }
  function drop(slot: number) {
    const current = gameRef.current;
    if (!current || current.phase !== "place") return;
    const value = lock({ ...current, selected: slot }, Date.now());
    if (value === current || value.phase !== "reveal") return;
    actionAt.current = Date.now();
    persist(value, true);
  }
  function advance() {
    const current = gameRef.current;
    // A held Space, double click or queued click must not advance the new round.
    if (!current || current.phase !== "reveal" || Date.now() - actionAt.current < 240) return;
    persist(next(current), true);
    actionAt.current = Date.now();
  }
  function aimYear(year: number | null) {
    const current = gameRef.current;
    if (current?.phase === "place") persist({ ...current, snipeYear: year });
  }
  return { game, save, started, now, notice, canAdvance, gameRef, play, preview, drop, expire, advance, aimYear, home: () => setStarted(false) };
}
