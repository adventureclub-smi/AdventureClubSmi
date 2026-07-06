"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./AnnouncementsManager.module.scss";

type Announcement = {
  id: string;
  title: string;
  message: string;
  trekId: string;
  trekTitle: string;
  createdAt: string;
};

type Trek = { id: string; title: string };

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  const [trekId, setTrekId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [annRes, treksRes] = await Promise.all([
          fetch("/api/admin/announcements"),
          fetch("/api/treks"),
        ]);

        if (!active) return;

        if (annRes.ok) setAnnouncements(await annRes.json());
        if (treksRes.ok) {
          const data = await treksRes.json();
          setTreks(Array.isArray(data) ? data : []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!trekId || !title || !message) return;

    setPosting(true);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/trip-announcements/${trekId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      if (!res.ok) {
        setStatus("Failed to post announcement.");
        return;
      }

      const created = await res.json();
      const trek = treks.find((t) => t.id === trekId);

      setAnnouncements((prev) => [
        {
          id: created.id,
          title: created.title,
          message: created.message,
          trekId,
          trekTitle: trek?.title || "",
          createdAt: created.createdAt,
        },
        ...prev,
      ]);

      setTitle("");
      setMessage("");
      setStatus("Announcement posted.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Announcements"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Announcements" }]}
      />

      <form className={styles.form} onSubmit={handleCreate}>
        <select value={trekId} onChange={(e) => setTrekId(e.target.value)} required>
          <option value="">Select trek...</option>
          {treks.map((trek) => (
            <option key={trek.id} value={trek.id}>
              {trek.title}
            </option>
          ))}
        </select>

        <input
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <button type="submit" disabled={posting}>
          <Send size={15} /> {posting ? "Posting..." : "Post Announcement"}
        </button>

        {status && <p className={styles.status}>{status}</p>}
      </form>

      <div className={styles.section}>
        <h2>
          <Megaphone size={18} /> Recent Announcements
        </h2>

        {loading ? (
          <p className={styles.hint}>Loading...</p>
        ) : announcements.length === 0 ? (
          <div className={styles.empty}>No announcements posted yet.</div>
        ) : (
          <div className={styles.list}>
            {announcements.map((a) => (
              <div key={a.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{a.title}</strong>
                  <span>{a.trekTitle}</span>
                </div>

                <p>{a.message}</p>

                <small>{new Date(a.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
