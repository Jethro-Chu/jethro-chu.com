import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="grid min-h-[100svh] place-items-center px-6 text-center"
    >
      <div className="max-w-md">
        <p className="label-mono tnum">off route</p>
        <h1 className="text-summit mt-4 text-[var(--color-shadow)]">404</h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--color-muted)]">
          This trail doesn&apos;t go anywhere. Head back to the valley and start
          again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[var(--color-golden-deep)] px-5 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-shadow)]"
        >
          Back to the trailhead
        </Link>
      </div>
    </main>
  );
}
