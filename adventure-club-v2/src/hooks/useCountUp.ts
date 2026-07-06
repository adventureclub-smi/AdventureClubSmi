"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number,
  active: boolean,
  duration = 1800
) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

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
