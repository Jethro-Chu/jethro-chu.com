"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advance, commit, emptySave, newGame, parseSave, LEGACY_STORAGE_KEY, STORAGE_KEY, tick, utcDate, validInput, type Game, type Mode, type Save, type Stance } from "@/lib/margillion/engine";

export function useMargillion() {
  const [save, setSave] = useState<Save>(emptySave);
  const [game, setGame] = useState<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [today, setToday] = useState("");
  const saveRef = useRef(save), gameRef = useRef(game);
  const loaded = useRef(false);
  const read = useCallback(() => {
    try { return parseSave(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)); }
    catch { return saveRef.current; }
  }, []);
  const persist = useCallback((next: Game) => {
    const disk = read();
    const merged: Save = { version: 2, daily: { ...saveRef.current.daily, ...disk.daily }, practice: disk.practice ?? saveRef.current.practice };
    if (next.mode === "daily") merged.daily[next.date] = next;
    else merged.practice = next;
    saveRef.current = merged; gameRef.current = next;
    setSave(merged); setGame(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); }
    catch { setNotice("Storage unavailable. This run is kept in memory only."); }
  }, [read]);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      const initial = read(); saveRef.current = initial; setSave(initial); setReady(true); setToday(utcDate());
      try { const key = `${STORAGE_KEY}:check`; localStorage.setItem(key, "1"); localStorage.removeItem(key); }
      catch { setNotice("Storage unavailable. This run is kept in memory only."); }
    }
    const sync = () => {
      const current = gameRef.current;
      const now = Date.now(); setToday(previous => previous === utcDate(now) ? previous : utcDate(now));
      if (current) { const next = tick(current, now); if (next !== current) persist(next); }
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = read(); saveRef.current = next; setSave(next);
      const current = gameRef.current;
      if (current) {
        const external = current.mode === "daily" ? next.daily[current.date] : next.practice;
        if (external?.id === current.id) { gameRef.current = external; setGame(external); sync(); }
      }
    };
    const interval = window.setInterval(sync, 100);
    window.addEventListener("storage", storage); document.addEventListener("visibilitychange", sync);
    return () => { clearInterval(interval); window.removeEventListener("storage", storage); document.removeEventListener("visibilitychange", sync); };
  }, [persist, read]);
  const play = useCallback((mode: Mode, fresh = false) => {
    const disk = read(), now = Date.now();
    const existing = mode === "daily" ? disk.daily[utcDate(now)] ?? saveRef.current.daily[utcDate(now)] : disk.practice ?? saveRef.current.practice;
    persist(tick(existing && !(fresh && mode === "practice") ? existing : newGame(mode, now, crypto.randomUUID()), now));
  }, [persist, read]);
  // Read the shared game at each action so two tabs cannot commit a tier twice.
  const act = useCallback((change: (value: Game, now: number) => Game) => {
    const current = gameRef.current;
    if (!current) return;
    const disk = read();
    const external = current.mode === "daily" ? disk.daily[current.date] : disk.practice;
    const shared = external?.id === current.id ? external : current;
    if (shared.phase !== current.phase || shared.rounds.length !== current.rounds.length) { persist(tick(shared, Date.now())); return; }
    const next = change(shared, Date.now());
    if (next !== current) persist(next);
  }, [persist, read]);
  const input = useCallback((value: string) => act((current, now) => current.phase === "guess" && validInput(value) ? { ...current, input: value } : tick(current, now)), [act]);
  const lock = useCallback((stance: Stance) => act((current, now) => commit(current, stance, now)), [act]);
  const next = useCallback(() => act((current, now) => advance(tick(current, now), now)), [act]);
  const home = useCallback(() => { gameRef.current = null; setGame(null); }, []);
  return { save, game, ready, today, notice, gameRef, play, input, lock, next, home };
}
