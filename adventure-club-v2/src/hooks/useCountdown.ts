"use client";

import { useEffect, useState } from "react";

export function useCountdown(target: string | Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    passed: false,
  });

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const difference = new Date(target).getTime() - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          passed: true,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        passed: false,
      });
    };

    update();
    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [target]);

  return timeLeft;
}
