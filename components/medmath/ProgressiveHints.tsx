"use client";

interface ProgressiveHintsProps {
  revealedHints: string[];
  totalHints?: number;
  onRevealNextHint: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ProgressiveHints({
  revealedHints,
  totalHints = 3,
  onRevealNextHint,
  isLoading = false,
  disabled = false,
}: ProgressiveHintsProps) {
  const currentCount = revealedHints.length;
  const canRevealMore = currentCount < totalHints;

  return (
    <div className="mt-4 space-y-3">
      {revealedHints.length > 0 && (
        <div className="space-y-2">
          {revealedHints.map((hint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-ink)] transition-all"
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs bg-[var(--color-primary)]/15 font-mono text-[10px] font-bold text-[var(--color-primary)]">
                {idx + 1}
              </div>
              <div className="flex-1 font-body">
                <span className="font-mono text-[11px] font-semibold text-[var(--color-ink-muted)]">
                  Hint {idx + 1}:{" "}
                </span>
                <span>{hint}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {canRevealMore && (
        <button
          type="button"
          onClick={onRevealNextHint}
          disabled={disabled || isLoading}
          className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sand)] hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>💡</span>
          <span>
            {isLoading
              ? "Loading Hint..."
              : currentCount === 0
              ? `Need a hint? (1 of ${totalHints})`
              : `Reveal next hint (${currentCount + 1} of ${totalHints})`}
          </span>
        </button>
      )}
    </div>
  );
}
