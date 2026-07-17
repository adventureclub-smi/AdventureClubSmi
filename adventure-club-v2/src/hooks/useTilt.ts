"use client";

import { useEffect, useState, type RefObject } from "react";
import { useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

// Subtle spring-damped tilt toward the cursor for a "premium" hover feel.
// No-ops entirely on touch devices (no cursor to react to) and under
// prefers-reduced-motion.
//
// Takes the target ref rather than creating one itself — see the comment
// in useScrollReveal.ts for why (an ESLint react-hooks/refs false positive
// on the whole returned object once any property is a ref).
export function useTilt<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  intensity = 10
) {
  const reducedMotion = useReducedMotion();
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    function checkPointer() {
      setPointerFine(window.matchMedia("(pointer: fine)").matches);
    }
    checkPointer();
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [intensity, -intensity]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-intensity, intensity]),
    springConfig
  );

  const active = pointerFine && !reducedMotion;

  function handleMouseMove(e: React.MouseEvent) {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return {
    style: active ? { rotateX, rotateY, transformPerspective: 800 } : undefined,
    handlers: active
      ? { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }
      : {},
  };
}
