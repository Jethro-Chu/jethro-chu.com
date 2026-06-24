"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// instrument charset: uppercase + digits read as a readout acquiring its value
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

/**
 * DecodeText — a mono "instrument acquiring its reading" reveal. When the label
 * scrolls into view it settles left-to-right out of scrambled glyphs, once. It
 * echoes the altimeter / telemetry identity (mono = instrument readout) rather
 * than adding a generic flourish.
 *
 * - SSR / no-JS / `prefers-reduced-motion` render the final text as-is.
 * - Zero layout shift: the frame always holds the same character count, and the
 *   mono face is fixed-width, so width never changes.
 * - Decorative: the real text is exposed to assistive tech via `aria-label`; the
 *   animating glyphs are `aria-hidden`.
 */
export function DecodeText({
  text,
  className,
  as: Tag = "span",
  duration = 640,
}: {
  text: string;
  className?: string;
  as?: "span" | "p" | "div";
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce) {
      setDisplay(text);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let started = false;
    const chars = [...text];

    const run = (now: number) => {
      const start = now;
      const frame = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // settle gently
        const locked = Math.floor(eased * chars.length);
        let out = "";
        for (let i = 0; i < chars.length; i++) {
          const c = chars[i];
          if (c === " " || c === "·" || c === "/" || i < locked) out += c;
          else out += GLYPHS[Math.floor(t / 26 + i * 7) % GLYPHS.length];
        }
        setDisplay(out);
        if (p < 1) raf = requestAnimationFrame(frame);
        else setDisplay(text);
      };
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        io.disconnect();
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.35 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration, reduce]);

  return (
    <Tag ref={ref as React.Ref<never>} className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </Tag>
  );
}
