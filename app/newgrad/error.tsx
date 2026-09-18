"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ng-root">
      <div className="ng-shell">
        <p className="ng-kicker">New Grad RN Tracker</p>
        <div className="ng-empty" role="alert">
          <p className="ng-empty-title">The tracker could not be loaded.</p>
          <p className="ng-empty-body">
            The dataset may be temporarily unavailable. Previously published
            data is preserved; please try again.
          </p>
          <button type="button" className="ng-btn" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
