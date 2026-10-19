import type { ReactNode } from "react";
import Link from "next/link";
import { site } from "@/content/content";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { RouteLine } from "@/components/scenery/RouteLine";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Shared chrome for a single project's detail page (/projects/<id>). Same
 * field-guide language as /resume: cream wash + route line, a back-to-portfolio
 * top bar, a serif hero, and a minimal footer. Sections are composed by the page
 * via <ProjectSection>.
 */
export function ProjectPageShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <BackgroundGradient />
      <RouteLine />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--color-granite-line)] px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-[1.05rem] font-medium text-[var(--color-shadow)]"
        >
          <span aria-hidden className="text-[var(--color-pine)] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          {site.name}
        </Link>
        <span className="label-mono">project</span>
      </header>

      <main id="main" className="px-6 sm:px-10 lg:pl-16 lg:pr-40">
        <div className="mx-auto max-w-3xl">
          {/* hero */}
          <section className="pb-10 pt-16 sm:pt-20">
            <p className="label-mono">{kicker}</p>
            <h1 className="text-summit mt-4 text-[var(--color-shadow)]">{title}</h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-muted)] sm:text-xl">
              {subtitle}
            </p>
          </section>

          {children}
        </div>
      </main>

      {/* minimal footer */}
      <footer className="border-t border-[var(--color-granite-line)] px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <Link href="/#projects" className="label-mono inline-flex items-center gap-2 transition-colors hover:text-[var(--color-pine)]">
            ← All projects
          </Link>
          <Link href="/" className="label-mono inline-flex items-center gap-2 transition-colors hover:text-[var(--color-pine)]">
            Back to portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** one editorial section: numbered mono label, serif heading, body */
export function ProjectSection({
  n,
  label,
  heading,
  children,
}: {
  n: string;
  label: string;
  heading?: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section className="border-t border-[var(--color-granite-line)] py-10 sm:py-12">
        <p className="label-mono flex items-center gap-2.5">
          <span className="text-[var(--color-pine)]">{n}</span>
          <span aria-hidden className="h-3 w-px bg-[var(--color-granite-line)]" />
          <span>{label}</span>
        </p>
        {heading && <h2 className="text-ridge mt-4 text-[var(--color-shadow)]">{heading}</h2>}
        <div className="mt-5 space-y-4 text-pretty text-[1.02rem] leading-relaxed text-[var(--color-shadow)]">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

/** a checklist of core features */
export function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it} className="flex gap-3">
          <span aria-hidden className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-[var(--color-pine)]" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** a quiet callout for the safety / positioning note */
export function CalloutNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--color-granite-line)] bg-[var(--color-card)] p-5 sm:p-6">
      <div className="space-y-3 text-[0.95rem] leading-relaxed text-[var(--color-muted)]">{children}</div>
    </div>
  );
}
