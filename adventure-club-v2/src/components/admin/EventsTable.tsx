"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { Plus, Pencil, Rocket, Trash2, MapPin, CalendarDays, Users, Trophy, QrCode } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import CopyLinkButton from "@/components/admin/shared/CopyLinkButton";
import styles from "./EventsTable.module.scss";

type EventRow = {
  id: string;
  title: string;
  destination: string;
  date: string;
  seats: number;
  description: string;
  coverImage?: string | null;
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
  const [generatingQrId, setGeneratingQrId] = useState<string | null>(null);

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

  async function handleGoLive(id: string, title: string) {
    const confirmGoLive = confirm(
      `Make "${title}" live? Every member gets the "New Trek/Workshop Announced" email immediately — only do this once registration details are ready.`
    );
    if (!confirmGoLive) return;

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

  async function downloadQr(id: string, title: string) {
    setGeneratingQrId(id);

    try {
      const url = `${window.location.origin}/events/${id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
        color: { dark: "#0d0d0d", light: "#ffffff" },
      });

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `navira-${slug || "event"}-qr.png`;
      link.click();
    } finally {
      setGeneratingQrId(null);
    }
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
          <span>Teams locked</span>
          <strong>{counts.drawn}</strong>
        </button>
      </div>

      {loading ? (
        <p className={styles.hint}>Loading events...</p>
      ) : visible.length === 0 ? (
        <div className={styles.empty}>No campus events in this view.</div>
      ) : (
        <div className={styles.grid}>
          {visible.map((event) => (
            <div key={event.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={event.coverImage || "/images/default-trek.jpg"}
                  alt={event.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 340px"
                  className={styles.image}
                />

                {event.eventTeamsDrawnAt && (
                  <span className={styles.archivedBadge}>Teams Locked</span>
                )}

                {event.isTest && <span className={styles.testBadge}>TEST</span>}

                {event.isDraft && <span className={styles.draftBadge}>DRAFT</span>}
              </div>

              <div className={styles.content}>
                <h2>{event.title}</h2>

                <div className={styles.info}>
                  <span>
                    <MapPin size={13} /> {event.destination}
                  </span>
                  <span>
                    <CalendarDays size={13} /> {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span>
                    <Users size={13} /> {event.eventTeamSize ? `${event.eventTeamSize} / team` : `${event.seats} Seats`}
                  </span>
                  {event.eventQualifiersCount && (
                    <span>
                      <Trophy size={13} /> Top {event.eventQualifiersCount}
                    </span>
                  )}
                </div>

                <p className={styles.description}>{event.description}</p>

                <div className={styles.buttons}>
                  {event.isDraft && (
                    <button className={styles.goLive} onClick={() => handleGoLive(event.id, event.title)}>
                      <Rocket size={14} /> Go Live
                    </button>
                  )}

                  <Link href={`/admin/events/${event.id}`} className={styles.manage}>
                    Manage Event
                  </Link>

                  <Link href={`/admin/edit-event/${event.id}`} className={styles.edit}>
                    <Pencil size={14} />
                  </Link>

                  <CopyLinkButton
                    path={`/events/${event.id}`}
                    label={`Copy link to ${event.title}`}
                    iconOnly
                    className={styles.copy}
                  />

                  <button
                    className={styles.copy}
                    title={`Download QR code for ${event.title}`}
                    aria-label={`Download QR code for ${event.title}`}
                    disabled={generatingQrId === event.id}
                    onClick={() => downloadQr(event.id, event.title)}
                  >
                    <QrCode size={14} />
                  </button>

                  <button className={styles.delete} onClick={() => handleDelete(event)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
