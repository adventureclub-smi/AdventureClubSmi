"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import styles from "./AnnouncementEditor.module.scss";

type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

export default function AnnouncementEditor({ trekId }: { trekId: string }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  async function getAnnouncements() {
    const res = await fetch(`/api/admin/trip-announcements/${trekId}`);

    return res.json();
  }

  useEffect(() => {
    async function loadAnnouncements() {
      const data = await getAnnouncements();

      setAnnouncements(data);
    }

    loadAnnouncements();
  }, [trekId]);

  async function publish() {
    if (!title || !message) {
      alert("Fill all fields");
      return;
    }

    await fetch(`/api/admin/trip-announcements/${trekId}`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        title,
        message,
      }),
    });

    setTitle("");
    setMessage("");

    const data = await getAnnouncements();

    setAnnouncements(data);
  }

  return (
    <section className={styles.announcements}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>
          <Megaphone size={18} />
        </span>

        <div>
          <h3>Trip Announcements</h3>
          <p>Live updates for approved students on this trek.</p>
        </div>
      </div>

      <div className={styles.composer}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Announcement..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="button" onClick={publish}>
          <Send size={17} />
          Publish Announcement
        </button>
      </div>

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <h4>Published</h4>
          <span>{announcements.length} updates</span>
        </div>

        {announcements.length === 0 ? (
          <div className={styles.empty}>No announcements published yet.</div>
        ) : (
          announcements.map((a) => (
            <article key={a.id} className={styles.item}>
              <strong>{a.title}</strong>

              <p>{a.message}</p>

              <small>{new Date(a.createdAt).toLocaleString()}</small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
