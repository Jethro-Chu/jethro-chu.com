"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nav, site, socials, hero } from "@/lib/site";
import { NurseBuilderMonogram } from "@/components/visual/NurseBuilderMonogram";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // solid on scroll and on every route except the very top of the home page
  const solid = scrolled || pathname !== "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Modal behavior for the mobile menu: lock scroll, make the rest of the
  // document inert, move focus in, close on Escape, and focus back to the toggle.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!open) {
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
      return;
    }
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    const id = requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    burgerRef.current?.focus();
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          solid ? "border-b border-line bg-bg" : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5 sm:px-8 lg:px-16">
          <Link
            href="/"
            className="focus-ring group flex items-center gap-2.5"
            aria-label={`${site.name}, home`}
          >
            <NurseBuilderMonogram size={28} />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Jethro Chu
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="link-underline font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <span
              className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted lg:inline-flex"
              aria-hidden
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {hero.locus}
            </span>
          </nav>

          <button
            ref={burgerRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="focus-ring -mr-1 grid size-9 place-items-center md:hidden"
          >
            <Burger open={open} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-40 bg-bg md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-full flex-col px-6 pb-10 pt-24">
              <ul className="flex flex-col">
                {nav.map((item, i) => (
                  <li key={item.href} className="border-b border-line">
                    <Link
                      href={item.href}
                      onClick={close}
                      className="focus-ring flex items-baseline justify-between py-5"
                    >
                      <span className="font-display text-3xl font-medium tracking-tight text-ink">
                        {item.label}
                      </span>
                      <span className="font-mono text-xs text-muted">0{i + 1}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="focus-ring link-underline font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <div className="relative h-3 w-5" aria-hidden>
      <motion.span
        className="absolute left-0 top-0 h-[1.5px] w-full bg-ink"
        animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute bottom-0 left-0 h-[1.5px] w-full bg-ink"
        animate={open ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
