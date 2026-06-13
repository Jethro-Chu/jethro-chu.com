import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative grid min-h-[100svh] place-items-center px-5">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-bone-faint">
          Error 404
        </p>
        <h1 className="mt-6 font-display text-hero leading-[0.9] tracking-tight">
          Off the <span className="italic text-gradient">map</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-pretty text-lg leading-relaxed text-bone-dim">
          This page wandered off — or never existed. Let&apos;s get you back to
          something real.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Button href="/" size="lg" arrow magnetic>
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
