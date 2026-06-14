"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Play, X } from "lucide-react";
import type { Project } from "@/lib/projects";
import { ProjectPoster } from "@/components/visual/posters/ProjectPoster";
import { LiveGlyph } from "@/components/visual/LiveGlyph";
import { cn } from "@/lib/utils";

/**
 * Reusable clinical "live window".
 *
 * - Facade: shows the project poster and only mounts the <iframe> when the
 *   visitor launches it.
 * - One live iframe at a time across the page (coordinated via a window event).
 * - Framed as a clinical instrument panel: 1px --line border, flat corners, a
 *   thin Space Mono top bar with the live amber pulse (only when live) + Open.
 * - Mobile: launching opens a fullscreen modal instead of an inline iframe.
 * - Not-embeddable URLs never mount a frame; they fall back to the poster + a
 *   prominent "Open live" button.
 * - Motion is CSS-only, so prefers-reduced-motion is honored globally.
 */

const LAUNCH_EVENT = "livewindow:launch";

export function LiveWindow({
  project,
  aspect = "16 / 10",
  className,
}: {
  project: Project;
  aspect?: string;
  className?: string;
}) {
  const id = useId();
  const live = project.live;
  const canEmbed = Boolean(live?.embeddable);

  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isLive = mounted || modal;

  useEffect(() => {
    function onLaunch(e: Event) {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== id) {
        setMounted(false);
        setModal(false);
        setLoaded(false);
      }
    }
    window.addEventListener(LAUNCH_EVENT, onLaunch);
    return () => window.removeEventListener(LAUNCH_EVENT, onLaunch);
  }, [id]);

  useEffect(() => {
    if (!modal) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  function launch() {
    if (!live || !canEmbed) return;
    window.dispatchEvent(new CustomEvent(LAUNCH_EVENT, { detail: { id } }));
    setLoaded(false);
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) setModal(true);
    else setMounted(true);
  }

  function close() {
    setMounted(false);
    setModal(false);
    setLoaded(false);
  }

  const state = !live ? null : isLive ? "Live" : canEmbed ? "Ready" : "External";

  const frame = live ? (
    <div className="absolute inset-0 bg-surface">
      <iframe
        src={live.url}
        title={`${project.title} live`}
        allow={live.allow}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full border-0"
      />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-surface">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="size-2 animate-pulse rounded-full bg-amber" />
            {live.loadingNote ?? "Loading"}
          </span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className={cn("border border-line bg-surface", className)}>
      {/* instrument top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {isLive ? (
            <LiveGlyph size={13} />
          ) : (
            <span aria-hidden className="size-2 shrink-0 rounded-full border border-line" />
          )}
          <span className="truncate text-ink">{project.title}</span>
          {state && (
            <>
              <span aria-hidden>·</span>
              <span>{state}</span>
            </>
          )}
        </span>

        <div className="flex shrink-0 items-center gap-3">
          {isLive && (
            <button
              type="button"
              onClick={close}
              className="focus-ring font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            >
              Stop
            </button>
          )}
          {live?.url && (
            <a
              href={live.url}
              target="_blank"
              rel="noreferrer noopener"
              className="focus-ring group/open inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            >
              Open
              <ArrowUpRight
                className="size-3 transition-transform duration-200 group-hover/open:-translate-y-0.5 group-hover/open:translate-x-0.5"
                strokeWidth={1.75}
              />
            </a>
          )}
        </div>
      </div>

      {/* body */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: aspect }}>
        <div className="absolute inset-0">
          <ProjectPoster project={project} />
        </div>

        {mounted && frame}

        {!mounted && live && (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-bg)_55%,transparent)] px-6 text-center">
            <div className="flex max-w-sm flex-col items-center gap-4">
              {live.consent && (
                <p className="font-mono text-[11px] leading-relaxed tracking-wide text-ink">
                  {live.consent}
                </p>
              )}
              {canEmbed ? (
                <button
                  type="button"
                  onClick={launch}
                  className="focus-ring inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
                >
                  <Play className="size-4" strokeWidth={1.75} />
                  {live.consent ? "Play" : "Launch"}
                </button>
              ) : (
                <a
                  href={live.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="focus-ring inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
                >
                  {live.openLabel ?? "Open live"}
                  <ArrowUpRight className="size-4" strokeWidth={1.75} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* mobile fullscreen modal */}
      {modal &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex flex-col bg-bg">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                <LiveGlyph size={13} />
                <span className="text-ink">{project.title}</span>
                <span aria-hidden>·</span> Live
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close live preview"
                className="focus-ring inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
              >
                Close
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="relative flex-1">{frame}</div>
          </div>,
          document.body
        )}
    </div>
  );
}
