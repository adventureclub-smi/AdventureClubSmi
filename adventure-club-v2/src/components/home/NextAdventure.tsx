"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./NextAdventure.module.scss";

type Trek = {
  id: string;
  title: string;
  date: string;
};

export default function NextAdventure({
  trek,
}: {
  trek: Trek;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();

      const target = new Date(
        trek.date
      ).getTime();

      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      setTimeLeft({
        days: Math.floor(
          difference /
            (1000 * 60 * 60 * 24)
        ),

        hours: Math.floor(
          (difference %
            (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        ),

        minutes: Math.floor(
          (difference %
            (1000 * 60 * 60)) /
            (1000 * 60)
        ),

        seconds: Math.floor(
          (difference %
            (1000 * 60)) /
            1000
        ),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [trek]);

  return (
    <section className={styles.container}>
      <div className={styles.left}>
        <div className={styles.icon}>
          📅
        </div>

        <div>
          <p>Next Adventure Starts In</p>

          <h2>{trek.title}</h2>

          <span>
            {new Date(
              trek.date
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className={styles.countdown}>
        <div>
          <h1>{timeLeft.days}</h1>
          <p>DAYS</p>
        </div>

        <div>
          <h1>{timeLeft.hours}</h1>
          <p>HOURS</p>
        </div>

        <div>
          <h1>{timeLeft.minutes}</h1>
          <p>MINUTES</p>
        </div>

        <div>
          <h1>{timeLeft.seconds}</h1>
          <p>SECONDS</p>
        </div>
      </div>

      <Link
        href={`/treks/${trek.id}`}
        className={styles.button}
      >
        Register Now →
      </Link>
    </section>
  );
}