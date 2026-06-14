import { credentials } from "@/lib/site";
import { RangeBar } from "@/components/visual/RangeBar";
import { CountUp } from "@/components/visual/CountUp";

/**
 * The "Flowsheet" signature: hard facts presented like a lab panel.
 * Monospace, aligned columns, hairline rules, a settling range bar. The
 * honest-status move lives here: the in-progress / Beta row is the lone
 * amber "watch" value, so the accent draws the eye to candor, not away.
 */
export function Flowsheet({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
          Profile · J. Chu
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Ref. range
        </span>
      </div>

      <dl className="divide-y divide-line">
        {credentials.map((row) => {
          const numeric = /^\d+$/.test(row.value);
          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto_8.5rem]"
            >
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {row.label}
              </dt>
              <dd className="justify-self-end font-mono text-lg tabular-nums text-ink sm:text-xl">
                {numeric && row.label === "CLINICAL HOURS" ? (
                  <CountUp value={Number(row.value)} />
                ) : (
                  row.value
                )}
              </dd>
              <dd className="col-span-2 sm:col-span-1 sm:justify-self-end">
                {typeof row.bar === "number" ? (
                  <RangeBar
                    value={row.bar}
                    label={`${row.label}: ${row.value}`}
                    state={row.watch ? "watch" : "in-range"}
                  />
                ) : row.watch ? (
                  <span
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-amber-ink)" }}
                  >
                    <span
                      aria-hidden
                      className="size-2"
                      style={{ background: "var(--color-amber)" }}
                    />
                    {row.note ?? "watch"}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-muted">{row.note ?? ""}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
