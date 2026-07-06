"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";

import BackButton from "./shared/BackButton";
import styles from "./Announcements.module.scss";

type Registration = {
  status: string;
  trek: { id: string; title: string };
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  trekTitle: string;
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/my-registrations");
        if (!res.ok || !active) return;

        const registrations: Registration[] = await res.json();
        const relevant = registrations.filter((r) => r.status !== "REJECTED");

        const uniqueTreks = Array.from(
          new Map(relevant.map((r) => [r.trek.id, r.trek])).values()
        );

        const results = await Promise.all(
          uniqueTreks.map(async (trek) => {
            const announcementRes = await fetch(
              `/api/student/trip-announcements/${trek.id}`
            );
            if (!announcementRes.ok) return [];

            const items: Omit<Announcement, "trekTitle">[] =
              await announcementRes.json();

            return items.map((item) => ({ ...item, trekTitle: trek.title }));
          })
        );

        if (!active) return;

        const merged = results
          .flat()
          .sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setAnnouncements(merged);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>Announcements</h1>
      <p className={styles.subtitle}>
        Live updates from your registered and completed treks.
      </p>

      {loading ? (
        <p className={styles.empty}>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <div className={styles.empty}>
          <Megaphone size={36} />
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {announcements.map((item, i) => (
            <motion.article
              key={item.id}
              className={styles.card}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05 }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.trekTag}>{item.trekTitle}</span>
                {i === 0 && <span className={styles.newBadge}>NEW</span>}
              </div>

              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
