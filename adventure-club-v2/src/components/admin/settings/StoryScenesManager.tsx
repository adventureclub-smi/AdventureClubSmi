"use client";

import { useRef, useState } from "react";
import { Film, UploadCloud, Trash2 } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./StoryScenesManager.module.scss";

type StoryScene = {
  id: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  caption: string | null;
};

export default function StoryScenesManager({
  initialScenes,
}: {
  initialScenes: StoryScene[];
}) {
  const [scenes, setScenes] = useState<StoryScene[]>(initialScenes);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialScenes.map((s) => [s.id, s.caption || ""]))
  );

  const [newCaption, setNewCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [status, setStatus] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!imageFile) {
      setStatus("Please choose a picture to upload.");
      return;
    }

    setUploading(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("caption", newCaption.trim());
      form.append("imageFile", imageFile);

      const res = await fetch("/api/admin/story-scenes", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add scene.");
        return;
      }

      setScenes((prev) => [...prev, data]);
      setCaptionDrafts((prev) => ({ ...prev, [data.id]: data.caption || "" }));
      setNewCaption("");
      setImageFile(null);
      setImagePreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      setStatus("Scene added to the homepage.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveCaption(id: string) {
    setSavingId(id);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/story-scenes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: captionDrafts[id] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save caption.");
        return;
      }

      setScenes((prev) => prev.map((s) => (s.id === id ? data : s)));
      setStatus("Caption saved.");
    } finally {
      setSavingId("");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this scene from the homepage?")) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/story-scenes/${id}`, { method: "DELETE" });

      if (res.ok) {
        setScenes((prev) => prev.filter((s) => s.id !== id));
        setCaptionDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Story Scenes"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Story Scenes" },
        ]}
      />

      <p className={styles.subtitle}>
        Scenes added here appear one at a time (auto-advancing, with arrows to switch
        manually) in the &quot;Every Journey Leaves A Mark.&quot; section on the public
        homepage. Each image is shown at its natural size with the caption underneath —
        PNGs with a transparent background work best.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Picture</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/*"
            onChange={handleImageChange}
          />
        </div>

        <div>
          <label>Caption (optional)</label>
          <input
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="e.g. Are we there yet?"
          />
        </div>

        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={uploading}>
          <UploadCloud size={15} /> {uploading ? "Uploading..." : "Add Scene"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <Film size={17} /> On the Homepage ({scenes.length})
        </h3>

        {scenes.length === 0 ? (
          <div className={styles.empty}>No scenes added yet.</div>
        ) : (
          <div className={styles.list}>
            {scenes.map((scene) => (
              <div key={scene.id} className={styles.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene.imageUrl} alt="" className={styles.thumb} />

                <input
                  className={styles.captionInput}
                  value={captionDrafts[scene.id] ?? ""}
                  onChange={(e) =>
                    setCaptionDrafts((prev) => ({ ...prev, [scene.id]: e.target.value }))
                  }
                  placeholder="No caption"
                />

                <button
                  className={styles.saveButton}
                  onClick={() => handleSaveCaption(scene.id)}
                  disabled={savingId === scene.id}
                >
                  {savingId === scene.id ? "Saving..." : "Save"}
                </button>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(scene.id)}
                  disabled={deletingId === scene.id}
                  aria-label="Remove scene"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>New scenes are added to the end of the carousel.</p>
    </div>
  );
}
