"use client";

import { useEffect, useState } from "react";
import { DAY, FUSE } from "@/lib/margillion/engine";
import styles from "./Margillion.module.css";

export function Clock({ deadline, duration = FUSE, reveal = false }: { deadline: number; duration?: number; reveal?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { setNow(Date.now()); const interval = setInterval(() => setNow(Date.now()), 50); return () => clearInterval(interval); }, [deadline]);
  const left = Math.max(0, deadline - now), fraction = Math.min(1, left / duration);
  return <div className={styles.clock} data-urgency={reveal ? "normal" : left <= 4000 ? "critical" : left <= 8000 ? "watch" : "normal"}>
    {!reveal && <div className={styles.fuse} aria-hidden="true"><i style={{ transform: `scaleX(${fraction})` }}/></div>}
    <span className={styles.timer} role="timer" aria-label={reveal ? "Seconds until next tier" : "Seconds remaining"}>{reveal ? "NEXT IN " : ""}<strong>{(left / 1000).toFixed(1)}</strong><small>s</small></span>
  </div>;
}

export function NextDaily() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);
  const left = now === null ? 0 : DAY - now % DAY;
  const text = [Math.floor(left / 3600000), Math.floor(left % 3600000 / 60000), Math.floor(left % 60000 / 1000)].map(n => String(n).padStart(2, "0")).join(":");
  return <span>NEXT DAILY <time>{now === null ? "··:··:··" : text}</time> · 00:00 UTC</span>;
}
