"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { nav, site, socials } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-3" : "py-5"
        )}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav
            className={cn(
              "flex items-center justify-between gap-4 rounded-full px-4 py-2.5 transition-all duration-500",
              scrolled
                ? "glass-strong edge-light shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)]"
                : "border border-transparent"
            )}
          >
            {/* Wordmark */}
            <Link
              href="/"
              className="focus-ring group flex items-center gap-2.5 rounded-full pl-1 pr-2"
              aria-label={`${site.name} — home`}
            >
              <Monogram />
              <span className="font-display text-lg leading-none tracking-tight">
                Jethro<span className="text-bone-faint">.</span>
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="focus-ring relative rounded-full px-3.5 py-2 text-sm text-bone-dim transition-colors hover:text-bone"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <Button href="/#contact" size="sm" arrow magnetic>
                  Let&apos;s talk
                </Button>
              </div>

              {/* Mobile toggle */}
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="focus-ring relative grid size-10 place-items-center rounded-full border border-line bg-surface/50 md:hidden"
              >
                <Burger open={open} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Monogram() {
  return (
    <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-iris via-iris-soft to-aqua text-[13px] font-bold text-ink">
      <span className="relative z-10">J</span>
      <span className="absolute inset-0 opacity-60 mix-blend-overlay shimmer-line" />
    </span>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <div className="relative h-3.5 w-5">
      <motion.span
        className="absolute left-0 top-0 h-[1.5px] w-full rounded bg-bone"
        animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded bg-bone"
        animate={open ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="absolute bottom-0 left-0 h-[1.5px] w-full rounded bg-bone"
        animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass-strong absolute inset-0 flex flex-col px-6 pb-10 pt-28">
            <ul className="flex flex-col gap-1">
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    delay: 0.06 + i * 0.06,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="border-b border-line/60"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-baseline justify-between py-5"
                  >
                    <span className="font-display text-4xl tracking-tight">
                      {item.label}
                    </span>
                    <span className="font-mono text-xs text-bone-faint">
                      0{i + 1}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-auto"
            >
              <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline text-sm text-bone-dim"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <Button href="/#contact" size="lg" arrow className="w-full">
                Start a conversation
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
