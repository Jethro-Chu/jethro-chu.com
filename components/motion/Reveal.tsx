"use client";

import { m, useReducedMotion } from "framer-motion";

/**
 * A quiet enter animation: content settles up and fades in as it scrolls into
 * view, once. Calm easing, small travel, premium not bouncy. Under reduced
 * motion it renders the content as-is with no transform.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = useReducedMotion();
  const Tag = as === "li" ? m.li : m.div;

  if (reduce) {
    const Plain = as === "li" ? "li" : "div";
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </Tag>
  );
}
