import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { nav, site, socials } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-12 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="focus-ring font-display text-lg font-semibold tracking-tight text-ink"
            >
              Jethro Chu
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {site.role}. Based in {site.location}.
            </p>
          </div>

          <FooterCol
            title="Navigate"
            links={nav.map((n) => ({ label: n.label, href: n.href }))}
          />
          <FooterCol
            title="Elsewhere"
            links={socials.map((s) => ({ label: s.label, href: s.href, external: true }))}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            © 2026 {site.name}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Next.js · Tailwind · TypeScript
          </p>
          <Link
            href="#top"
            className="focus-ring group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
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
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              {...(l.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              className="link-underline text-sm text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
