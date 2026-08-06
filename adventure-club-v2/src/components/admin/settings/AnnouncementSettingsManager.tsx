"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./AnnouncementSettingsManager.module.scss";

export default function AnnouncementSettingsManager() {
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/settings/announcement");
        if (!res.ok || !active) return;

        const data = await res.json();
        setMessage(data.message || "");
        setIsActive(data.isActive ?? true);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/settings/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, isActive }),
      });

      const data = await res.json();
      setStatus(res.ok ? "Announcement saved." : data.message || "Failed to save.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.hint}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Homepage Announcement"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Homepage Announcement" },
        ]}
      />

      <p className={styles.subtitle}>
        Shown as a banner in the homepage hero to every visitor — logged in
        or not. Turn it off below instead of deleting it if you want to
        reuse the same text later.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <label>Announcement Text</label>
        <textarea
          rows={3}
          placeholder="e.g. Registrations for the Kudremukh trek open this Friday!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Show on homepage
        </label>

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Announcement"}
        </button>
      </div>

      {isActive && message.trim() && (
        <div className={styles.previewSection}>
          <h3>Preview</h3>
          <div className={styles.previewBanner}>{message}</div>
        </div>
      )}
    </div>
  );
}
