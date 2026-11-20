"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Rocket, Trash2 } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import CopyLinkButton from "@/components/admin/shared/CopyLinkButton";
import styles from "./EventsTable.module.scss";

type EventRow = {
  id: string;
  title: string;
  destination: string;
  date: string;
  seats: number;
  eventTeamSize: number | null;
  eventQualifiersCount: number | null;
  eventTeamsDrawnAt: string | null;
  isTest?: boolean;
  isDraft?: boolean;
};

type Filter = "all" | "draft" | "open" | "drawn";

function statusOf(event: EventRow): Filter {
  if (event.isDraft) return "draft";
  if (event.eventTeamsDrawnAt) return "drawn";
  return "open";
}

export default function EventsTable() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: events.length,
      draft: events.filter((e) => statusOf(e) === "draft").length,
      open: events.filter((e) => statusOf(e) === "open").length,
      drawn: events.filter((e) => statusOf(e) === "drawn").length,
    }),
    [events]
  );

  const visible = useMemo(
    () => (filter === "all" ? events : events.filter((e) => statusOf(e) === filter)),
    [events, filter]
  );

  async function handleGoLive(id: string) {
    setStatus("");
    const res = await fetch("/api/admin/treks/go-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trekId: id }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(data?.message || "Failed to go live.");
      return;
    }

    fetchEvents();
  }

  async function handleDelete(event: EventRow) {
    const confirmed = confirm(
      `Delete "${event.title}"? This removes all its registrations, teams and matches too — this can't be undone.`
    );
    if (!confirmed) return;

    setStatus("");
    const res = await fetch(`/api/treks/${event.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(data?.message || "Failed to delete event.");
      return;
    }

    fetchEvents();
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Campus Events"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Campus Events" }]}
        quickActions={
          <Link href="/admin/create-event" className={styles.createButton}>
            <Plus size={16} /> Create Event
          </Link>
        }
      />

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.filters}>
        <button
          className={`${styles.filterCard} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          <span>All events</span>
          <strong>{counts.all}</strong>
        </button>
        <button
          className={`${styles.filterCard} ${filter === "draft" ? styles.active : ""}`}
          onClick={() => setFilter("draft")}
        >
          <span>Draft</span>
          <strong>{counts.draft}</strong>
        </button>
        <button
          className={`${styles.filterCard} ${filter === "open" ? styles.active : ""}`}
          onClick={() => setFilter("open")}
        >
          <span>Registration open</span>
          <strong>{counts.open}</strong>
        </button>
        <button
          className={`${styles.filterCard} ${filter === "drawn" ? styles.active : ""}`}
          onClick={() => setFilter("drawn")}
        >
          <span>Teams drawn</span>
          <strong>{counts.drawn}</strong>
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading events...</p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No campus events in this view.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Venue</th>
              <th>Date</th>
              <th>Teams</th>
              <th>Qualify</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className={styles.titleCell}>
                    <strong>{event.title}</strong>
                    {event.isDraft && <span className={`${styles.pill} ${styles.pillDraft}`}>Draft</span>}
                    {event.isTest && <span className={`${styles.pill} ${styles.pillTest}`}>Test</span>}
                    {event.eventTeamsDrawnAt && (
                      <span className={`${styles.pill} ${styles.pillDrawn}`}>Drawn</span>
                    )}
                  </div>
                </td>
                <td className={styles.meta} data-label="Venue">{event.destination}</td>
                <td className={styles.meta} data-label="Date">
                  {new Date(event.date).toLocaleDateString()}
                </td>
                <td className={styles.meta} data-label="Teams">
                  {event.eventTeamSize ? `${event.eventTeamSize} / team` : "—"}
                </td>
                <td className={styles.meta} data-label="Qualify">
                  {event.eventQualifiersCount ? `Top ${event.eventQualifiersCount}` : "—"}
                </td>
                <td data-label="">
                  <div className={styles.rowActions}>
                    <Link href={`/admin/events/${event.id}`}>Manage</Link>
                    <Link href={`/admin/edit-event/${event.id}`}>
                      <Pencil size={13} />
                    </Link>
                    <CopyLinkButton path={`/events/${event.id}`} iconOnly />
                    {event.isDraft && (
                      <button type="button" onClick={() => handleGoLive(event.id)}>
                        <Rocket size={13} /> Go Live
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(event)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
