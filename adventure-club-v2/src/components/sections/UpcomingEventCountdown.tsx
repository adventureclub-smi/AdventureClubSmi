"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";
import styles from "./UpcomingEventCountdown.module.scss";

type UpcomingEvent = {
  id: string;
  title: string;
  destination: string;
  eventStartsAt: string;
} | null;

const POLL_MS = 30000;

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

function formatStart(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

function Digit({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <motion.div
      className={styles.digit}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <small>{label}</small>
    </motion.div>
  );
}

// The "before" state that leads into LiveLeagueSection — shows a live
// countdown to the next Campus Event's actual kickoff (set via the event's
// own "Event Start Time" field) and primes visitors for what happens once
// it starts: their team and the live standings take over this same spot.
// Renders nothing when there's no upcoming event to count down to, and
// nothing again the moment that event's tournament actually starts (the
// homepage route stops returning it, and LiveLeagueSection takes the slot
// instead).
export default function UpcomingEventCountdown() {
  const [event, setEvent] = useState<UpcomingEvent>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/homepage/upcoming-event", { cache: "no-store" });
        if (!active || !res.ok) return;
        const json = await res.json();
        setEvent(json.event ?? null);
      } catch {
        // Next poll recovers.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!event) return null;

  return <CountdownCard event={event} />;
}

function CountdownCard({ event }: { event: NonNullable<UpcomingEvent> }) {
  const time = useCountdown(event.eventStartsAt);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.h2 {...fade} transition={{ duration: 0.5 }}>
          {event.title}
        </motion.h2>
        <motion.p
          className={styles.subheading}
          {...fade}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          {event.destination} · {formatStart(event.eventStartsAt)}
        </motion.p>

        {time.passed ? (
          <motion.p className={styles.startingNow} {...fade} transition={{ duration: 0.5, delay: 0.16 }}>
            Kicking off right about now — teams will appear here shortly.
          </motion.p>
        ) : (
          <div className={styles.timer}>
            <Digit value={time.days} label="Days" delay={0.16} />
            <Digit value={time.hours} label="Hours" delay={0.22} />
            <Digit value={time.minutes} label="Minutes" delay={0.28} />
            <Digit value={time.seconds} label="Seconds" delay={0.34} />
          </div>
        )}

        <motion.div
          className={styles.teaser}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.42 }}
        >
          <p>
            Teams haven&apos;t been drawn yet — once the tournament starts,
            this is exactly where you&apos;ll see which one you&apos;re on,
            alongside the live standings.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href={`/events/${event.id}`} className={styles.viewLink}>
            Register or view details
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
