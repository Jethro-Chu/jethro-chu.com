import { credentials } from "@/lib/site";
import { RangeBar } from "@/components/visual/RangeBar";

/**
 * The "Flowsheet" signature — hard facts presented like a lab panel:
 * monospace, aligned columns, hairline rules, a settling range bar.
 * Used sparingly (this is one of 2–3 deliberate appearances).
 */
export function Flowsheet({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* panel header — like a report banner */}
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
          Profile — J. Chu
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Ref. range
        </span>
      </div>

      <dl className="divide-y divide-line">
        {credentials.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto_8.5rem]"
          >
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {row.label}
            </dt>
            <dd className="justify-self-end font-mono text-lg tabular-nums text-ink sm:text-xl">
              {row.value}
            </dd>
            <dd className="col-span-2 sm:col-span-1 sm:justify-self-end">
              {typeof row.bar === "number" ? (
                <RangeBar value={row.bar} label={`${row.label}: ${row.value}`} />
              ) : (
                <span className="font-mono text-[11px] text-muted">
                  {row.note ?? ""}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
