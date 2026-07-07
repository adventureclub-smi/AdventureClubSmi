"use client";

import type { RefObject } from "react";
import { useScroll, useTransform, useReducedMotion } from "framer-motion";

// Ties a section's depth/opacity to its own scroll progress — as it enters
// the viewport it settles into place, and as it's scrolled past it recedes
// slightly, so sections feel connected rather than abruptly cutting from
// one to the next. Pure transform/opacity, so it never affects layout.
//
// Takes the target ref rather than creating one itself — the ESLint
// react-hooks/refs rule (React Compiler) currently taints an entire
// returned object once any property on it is a ref, flagging even the
// unrelated style value as an unsafe render-time ref read. Owning the ref
// in the calling component instead avoids that entirely.
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>
) {
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"],
  });

  const rawOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.4, 1, 1, 0.4]
  );
  const rawScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.94, 1, 1, 0.94]
  );
  const rawY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [56, 0, 0, -56]);

  // Reduced motion: skip the scroll-tied transform entirely rather than
  // binding constant values — sections just render at their natural state.
  return reducedMotion
    ? undefined
    : { opacity: rawOpacity, scale: rawScale, y: rawY };
}
