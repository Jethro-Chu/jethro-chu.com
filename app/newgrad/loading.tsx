export default function Loading() {
  return (
    <main className="ng-root" aria-busy="true" aria-live="polite">
      <div className="ng-shell">
        <p className="ng-kicker">New Grad RN Tracker</p>
        <p className="ng-loading">Loading verified openings…</p>
      </div>
    </main>
  );
}
