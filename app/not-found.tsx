import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[100svh] place-items-center px-6">
      <div className="w-full max-w-md">
        <div className="border-t border-line pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Error 404 · no reading
          </span>
        </div>
        <h1 className="mt-8 font-display text-hero font-medium tracking-tight">
          Off the chart.
        </h1>
        <p className="mt-6 text-pretty leading-relaxed text-muted">
          This page wandered off, or never existed. Let&apos;s get you back to
          something real.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="/" size="lg" arrow>
            Back home
          </Button>
          <Button href="/#work" size="lg" variant="outline">
            See the work
          </Button>
        </div>
      </div>
    </section>
  );
}
