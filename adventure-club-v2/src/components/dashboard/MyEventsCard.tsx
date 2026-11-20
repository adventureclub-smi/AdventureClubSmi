"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import styles from "./MyEventsCard.module.scss";

type EventEntry = {
  eventId: string;
  title: string;
  destination: string;
  date: string;
  shortCode: string;
  teamName: string | null;
  teamsDrawnAt: string | null;
  attendanceMarked: boolean;
};

// Campus Events (Tug of War, etc.) aren't Treks, so they never showed up
// anywhere on the student dashboard before this — a student registering
// for one had no way to find their QR/code again except by going straight
// back to the event's own page.
export default function MyEventsCard() {
  const [events, setEvents] = useState<EventEntry[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/my-events");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Your Campus Events</h2>

      <div className={styles.grid}>
        {events.map((event) => (
          <Link key={event.eventId} href={`/events/${event.eventId}`} className={styles.card}>
            <span className={styles.code}>{event.shortCode}</span>

            <div className={styles.info}>
              <h3>{event.title}</h3>
              <p>
                {event.destination} · {new Date(event.date).toLocaleDateString()}
              </p>
              {event.teamName && <p>Team: {event.teamName}</p>}
              {event.attendanceMarked && (
                <span className={styles.presentTag}>
                  <CheckCircle2 size={13} /> Checked in
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
