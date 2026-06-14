import type { CSSProperties } from "react";
import type { ProjectTheme } from "@/lib/projects";

/**
 * Scope a project theme onto an element as CSS variables, so every shared
 * component (glyph, range bar, waveform, buttons, type) recolors to the
 * project automatically. The token NAMES stay identical; only values change.
 */
export function projectThemeStyle(t: ProjectTheme): CSSProperties {
  return {
    backgroundColor: t.bg,
    color: t.ink,
    "--color-bg": t.bg,
    "--color-surface": t.surface,
    "--color-surface-sunk": t.surfaceSunk,
    "--color-ink": t.ink,
    "--color-muted": t.muted,
    "--color-line": t.line,
    // the theme's muted is AA on its bg, so it doubles as a perceivable (≥3:1) strong line
    "--color-line-strong": t.muted,
    "--color-primary": t.primary,
    "--color-primary-deep": t.primaryDeep,
    "--color-primary-mark": t.primary,
    "--color-primary-wash": t.wash,
    "--color-on-primary": t.onPrimary,
  } as CSSProperties;
}
