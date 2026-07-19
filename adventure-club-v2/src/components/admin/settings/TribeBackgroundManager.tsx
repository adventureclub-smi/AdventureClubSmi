"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./TribeBackgroundManager.module.scss";

type Background = {
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
};

export default function TribeBackgroundManager() {
  const [background, setBackground] = useState<Background>({ mediaUrl: null, mediaType: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/settings/tribe-background");
        if (!res.ok || !active) return;
        setBackground(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Please select an image or video file.");
      return;
    }

    setUploading(true);
    setStatus("Uploading and compressing — this can take a moment for video...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/settings/tribe-background", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save background.");
        return;
      }

      setBackground(data);
      setStatus("Background updated.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm("Remove the Tribe page background and go back to the default?")) return;

    setRemoving(true);

    try {
      await fetch("/api/admin/settings/tribe-background", { method: "DELETE" });
      setBackground({ mediaUrl: null, mediaType: null });
      setStatus("Background removed.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <p className={styles.hint}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tribe Background"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Tribe Background" },
        ]}
      />

      <p className={styles.subtitle}>
        Sets the background behind the &quot;Meet the Tribe&quot; page. Upload an
        image or a short muted looping video — either is automatically
        compressed as much as possible without a visible quality drop.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.preview}>
        {background.mediaType === "VIDEO" && background.mediaUrl ? (
          <video
            src={background.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className={styles.previewMedia}
          />
        ) : background.mediaType === "IMAGE" && background.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background.mediaUrl} alt="Tribe background" className={styles.previewMedia} />
        ) : (
          <div className={styles.empty}>No custom background set — using the default.</div>
        )}
      </div>

      <div className={styles.actions}>
        <label className={styles.uploadButton}>
          <UploadCloud size={15} />
          {uploading ? "Working..." : "Upload New Background"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
        </label>

        {background.mediaUrl && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
            disabled={removing}
          >
            <Trash2 size={15} />
            {removing ? "Removing..." : "Remove Background"}
          </button>
        )}
      </div>
    </div>
  );
}
