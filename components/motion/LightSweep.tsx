"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * The alpenglow. A warm wash, anchored low in the viewport, that resolves as
 * the climb nears the summit. Scroll-linked opacity only (cheap to paint), and
 * it sits behind all content so it warms the scene, never the text. Under
 * reduced motion it renders nothing and the static BackgroundGradient carries
 * the warmth on its own.
 */
export function LightSweep() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.45, 0.8, 1], [0, 0.3, 0.4]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        opacity,
        willChange: "opacity",
        background:
          "radial-gradient(125% 80% at 50% 108%, color-mix(in oklab, var(--color-horizon) 30%, transparent) 0%, transparent 60%)",
      }}
    />
  );
}
