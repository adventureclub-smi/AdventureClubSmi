"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./StudentDashboardSettings.module.scss";

export default function StudentDashboardSettings() {
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/student-dashboard");
        if (!res.ok || !active) return;

        const data = await res.json();
        setBannerImageUrl(data.bannerImageUrl || "");
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image file.");
      return;
    }

    setBannerFile(file);
    setStatus("");
  }

  async function save() {
    if (!bannerFile) {
      setStatus("Choose an image first.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("bannerFile", bannerFile);

      const res = await fetch("/api/admin/settings/student-dashboard", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save.");
        return;
      }

      setBannerImageUrl(data.bannerImageUrl || "");
      setBannerFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("Student dashboard banner saved.");
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
        title="Student Dashboard"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Student Dashboard" },
        ]}
      />

      <p className={styles.subtitle}>
        The banner image shown behind the greeting at the top of every
        student&apos;s dashboard. Replaces the old looping background video —
        a static image loads instantly and costs far less bandwidth.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <label>Banner Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {(bannerFile || bannerImageUrl) && (
          <div className={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerFile ? URL.createObjectURL(bannerFile) : bannerImageUrl}
              alt="Student dashboard banner preview"
              className={styles.preview}
            />
          </div>
        )}

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Banner"}
        </button>
      </div>
    </div>
  );
}
