"use client";

import { useRef, useState } from "react";
import { Music, UploadCloud, Trash2, Send } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./SongsManager.module.scss";

type Song = {
  id: string;
  title: string;
  audioUrl: string;
  thumbnailUrl: string;
};

export default function SongsManager({
  initialSongs,
}: {
  initialSongs: Song[];
}) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);

  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setStatus("Please select an MP3 audio file.");
      return;
    }

    setAudioFile(file);
    setStatus("");
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file for the thumbnail.");
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width !== img.height) {
        setStatus(
          `Thumbnail must be a square image (this one is ${img.width}×${img.height}).`
        );
        URL.revokeObjectURL(objectUrl);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
        return;
      }

      setThumbnailFile(file);
      setThumbnailPreview(objectUrl);
      setStatus("");
    };

    img.src = objectUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !audioFile || !thumbnailFile) {
      setStatus("Song name, an MP3 file, and a square thumbnail are all required.");
      return;
    }

    setUploading(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("audioFile", audioFile);
      form.append("thumbnailFile", thumbnailFile);

      const res = await fetch("/api/admin/songs", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to upload song.");
        return;
      }

      setSongs((prev) => [...prev, data]);
      setTitle("");
      setAudioFile(null);
      setThumbnailFile(null);
      setThumbnailPreview("");
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      setStatus("Song added to Club Vibe Check.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this song from Club Vibe Check?")) return;

    const res = await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });

    if (res.ok) {
      setSongs((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Music"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Music" },
        ]}
      />

      <p className={styles.subtitle}>
        Songs uploaded here power the &quot;Club Vibe Check&quot; section on the public
        homepage.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Song Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" />
        </div>

        <div>
          <label>MP3 File</label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
          />
          {audioFile && <span className={styles.fileName}>{audioFile.name}</span>}
        </div>

        <div>
          <label>Thumbnail (must be square)</label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
          />
        </div>

        {thumbnailPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailPreview} alt="Thumbnail preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={uploading}>
          <UploadCloud size={15} /> {uploading ? "Uploading..." : "Add Song"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <Music size={17} /> Current Playlist ({songs.length})
        </h3>

        {songs.length === 0 ? (
          <div className={styles.empty}>No songs uploaded yet.</div>
        ) : (
          <div className={styles.list}>
            {songs.map((song) => (
              <div key={song.id} className={styles.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={song.thumbnailUrl} alt={song.title} className={styles.thumb} />

                <strong>{song.title}</strong>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(song.id)}
                  aria-label="Delete song"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>
        <Send size={13} /> New songs are added to the end of the playlist.
      </p>
    </div>
  );
}
