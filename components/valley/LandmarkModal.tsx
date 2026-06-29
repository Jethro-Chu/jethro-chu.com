"use client";

/* ============================================================
   LandmarkModal  ·  the React side of the bridge (§4)
   Listens for landmark:enter, opens a Framer modal with content from
   content/portfolio.ts (and the pack faceset as a headshot, Peter-style),
   pauses the game while open, traps focus, closes on ESC / backdrop,
   restores focus + resumes on close. m.* (LazyMotion strict), site tokens.
   ============================================================ */

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameBus } from "@/lib/gameBus";
import { landmarkById, projectsForLandmark, type Landmark } from "@/content/portfolio";

export function LandmarkModal() {
  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(
    () =>
      gameBus.on("landmark:enter", ({ id }) => {
        const l = landmarkById(id);
        if (!l) return;
        lastFocus.current = document.activeElement as HTMLElement;
        setLandmark(l);
        gameBus.emit("game:pause");
      }),
    []
  );

  const close = useCallback(() => {
    setLandmark(null);
    gameBus.emit("game:resume");
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!landmark) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [landmark, close]);

  const dur = reduce ? 0 : 0.22;
  const projects = landmark ? projectsForLandmark(landmark) : [];

  return (
    <AnimatePresence>
      {landmark && (
        <m.div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
        >
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-shadow)_64%,transparent)]"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="landmark-title"
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 18 }}
            transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[86vh] w-full max-w-md overflow-y-auto rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              {landmark.faceset && (
                <img
                  src={landmark.faceset}
                  alt=""
                  width={38}
                  height={38}
                  className="size-11 shrink-0 rounded-sm border border-[var(--color-granite-line)]"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="eyebrow">{landmark.section}</span>
                </div>
                <h2
                  id="landmark-title"
                  className="text-rise mt-0.5 text-[var(--color-shadow)]"
                >
                  {landmark.title}
                </h2>
                <p className="label-mono text-[0.66rem]">{landmark.landmark}</p>
              </div>
            </div>

            {landmark.authoredLine && (
              <p className="mt-4 rounded-sm border border-dashed border-[var(--color-golden)] bg-[color-mix(in_oklab,var(--color-golden)_8%,transparent)] p-3 text-[0.82rem] italic text-[var(--color-muted)]">
                <span className="label-mono not-italic">Draft · Jethro to author —</span>{" "}
                {landmark.authoredLine.replace(/^JETHRO:\s*/, "")}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {landmark.body.map((para, i) => (
                <p key={i} className="text-[0.95rem] leading-relaxed text-[var(--color-shadow)]">
                  {para}
                </p>
              ))}
            </div>

            {projects.length > 0 && (
              <ul className="mt-5 space-y-3 border-t border-[var(--color-granite-line)] pt-4">
                {projects.map((proj) => (
                  <li key={proj.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[1.02rem] font-medium text-[var(--color-shadow)]">
                        {proj.title}
                      </span>
                      {proj.link && (
                        <a
                          href={proj.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label-mono shrink-0 text-[0.68rem] text-[var(--color-pine)] underline underline-offset-2 hover:text-[var(--color-pine-deep)]"
                        >
                          {proj.link.label}
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-[0.82rem] leading-snug text-[var(--color-muted)]">
                      {proj.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {landmark.links && landmark.links.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {landmark.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="fast-ui rounded-sm border border-[var(--color-pine)] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--color-pine)] hover:bg-[var(--color-pine)] hover:text-[var(--color-on-dark)]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}

            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="fast-ui mt-6 w-full rounded-sm bg-[var(--color-shadow)] px-4 py-2 text-[0.82rem] font-medium text-[var(--color-on-dark)]"
            >
              Back to the village
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
