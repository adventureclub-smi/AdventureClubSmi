"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number,
  active: boolean,
  duration = 1800
) {
  const [value, setValue] = useState(0);
  // Tracks the last target actually animated to, rather than a plain
  // started-or-not flag — the card mounts before its real stats have
  // loaded (target starts at 0), plays a no-op 0-to-0 animation the
  // instant it scrolls into view, and only *then* does the fetch resolve
  // and hand it the real number. A plain "already started" latch would
  // permanently ignore that later, real target change and leave every
  // card frozen at 0.
  const lastAnimatedTarget = useRef<number | null>(null);

  useEffect(() => {
    if (!active || lastAnimatedTarget.current === target) return;
    lastAnimatedTarget.current = target;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}
