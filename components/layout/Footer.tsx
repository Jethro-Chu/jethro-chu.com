import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { nav, site, socials } from "@/lib/site";

export function Footer() {
  const year = "2026";

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line/60">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-64 w-[80%] rounded-full bg-iris/20 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-8">
        {/* CTA row */}
        <div className="flex flex-col gap-8 border-b border-line/60 pb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bone-faint">
              Have something in mind?
            </p>
            <h2 className="mt-4 max-w-xl font-display text-display tracking-tight">
              Let&apos;s build something{" "}
              <span className="text-gradient">people trust</span>.
            </h2>
          </div>
          <a
            href={`mailto:${site.email}`}
            className="link-underline group inline-flex items-center gap-3 self-start text-lg text-bone md:self-auto"
          >
            <span className="font-mono text-sm text-bone-dim">→</span>
            {site.email}
          </a>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-2 gap-10 py-14 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-bone-faint">
              {site.name}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone-dim">
              {site.role}. Based in {site.location}.
            </p>
          </div>

          <FooterCol title="Navigate" links={nav.map((n) => ({ label: n.label, href: n.href }))} />
          <FooterCol
            title="Elsewhere"
            links={socials.map((s) => ({ label: s.label, href: s.href, external: true }))}
          />

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-bone-faint">
              Status
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-3 py-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-[pulse-ring_3s_ease-out_infinite] rounded-full bg-aqua" />
                <span className="relative inline-flex size-2 rounded-full bg-aqua" />
              </span>
              <span className="text-xs text-bone-dim">
                {site.available ? "Open to new work" : "Currently heads-down"}
              </span>
            </div>
          </div>
        </div>

        {/* giant wordmark */}
        <div className="relative">
          <Link
            href="/"
            aria-label="Back to top"
            className="block select-none"
          >
            <span className="block bg-gradient-to-b from-bone/15 to-bone/0 bg-clip-text text-center font-display text-[22vw] font-semibold leading-[0.8] tracking-tighter text-transparent">
              Jethro Chu
            </span>
          </Link>
        </div>

        {/* bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-6 text-xs text-bone-faint sm:flex-row">
          <p>
            © {year} {site.name}. Designed &amp; built end-to-end.
          </p>
          <p className="font-mono">
            Crafted with Next.js, Tailwind &amp; Framer Motion.
          </p>
          <Link
            href="#top"
            className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-bone-dim transition-colors hover:border-iris-soft/40 hover:text-bone"
          >
            Back to top
            <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-bone-faint">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              {...(l.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              className="link-underline text-sm text-bone-dim transition-colors hover:text-bone"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
