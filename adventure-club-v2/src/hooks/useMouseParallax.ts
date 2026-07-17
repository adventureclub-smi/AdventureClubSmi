"use client";

import { useEffect, useState, type RefObject } from "react";
import { useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

// Subtle spring-damped translation away from the cursor — used for hero
// background layers rather than card tilt (see useTilt for that). No-ops on
// touch devices and under prefers-reduced-motion, same as useTilt.
//
// Takes the target ref rather than creating one itself, matching every
// other hook here — see useScrollReveal's comment for why.
export function useMouseParallax(ref: RefObject<HTMLElement | null>, intensity = 20) {
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

  const springConfig = { stiffness: 100, damping: 20, mass: 0.5 };
  const translateX = useSpring(useTransform(x, [-0.5, 0.5], [intensity, -intensity]), springConfig);
  const translateY = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), springConfig);

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
    style: active ? { x: translateX, y: translateY } : undefined,
    handlers: active ? { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave } : {},
  };
}
