"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users } from "lucide-react";

import styles from "@/components/treks/StudentTreks.module.scss";

type EventRow = {
  id: string;
  title: string;
  destination: string;
  date: string;
  seats: number;
  eventTeamSize: number | null;
  coverImage?: string | null;
  status: string;
};

export default function StudentEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (active) setEvents(Array.isArray(data) ? data : []);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () =>
      [...events]
        .filter((e) => e.status !== "Completed")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Campus Events</h1>
        <p>Register individually — teams are formed at random once registration closes.</p>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading events...</p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No campus events right now.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((event, i) => (
            <motion.div
              key={event.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
            >
              <Link href={`/events/${event.id}`} className={styles.imageWrap}>
                <Image
                  src={event.coverImage || "/images/default-trek.jpg"}
                  alt={event.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 340px"
                  className={styles.image}
                />
                <div className={styles.overlay} />
                {event.eventTeamSize && (
                  <span className={styles.difficulty}>Teams of {event.eventTeamSize}</span>
                )}
              </Link>

              <div className={styles.content}>
                <h2>{event.title}</h2>

                <p>
                  <MapPin size={14} /> {event.destination}
                </p>

                <p>
                  <CalendarDays size={14} />{" "}
                  {new Date(event.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <p>
                  <Users size={14} /> {event.seats < 99999 ? `${event.seats} spots` : "Open entry"}
                </p>

                <div className={styles.footer}>
                  <span className={styles.price}>Free</span>

                  <button
                    className={styles.registerButton}
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    View & Register
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
