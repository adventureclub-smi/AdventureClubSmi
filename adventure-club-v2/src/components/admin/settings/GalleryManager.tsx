"use client";

import { useRef, useState } from "react";
import { Images, UploadCloud, Trash2 } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./GalleryManager.module.scss";

type GalleryPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export default function GalleryManager({
  initialPhotos,
}: {
  initialPhotos: GalleryPhoto[];
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
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
      setStatus("Please choose a photo to upload.");
      return;
    }

    setUploading(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("caption", caption.trim());
      form.append("imageFile", imageFile);

      const res = await fetch("/api/admin/homepage-gallery", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to upload photo.");
        return;
      }

      setPhotos((prev) => [...prev, data]);
      setCaption("");
      setImageFile(null);
      setImagePreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      setStatus("Photo added to the homepage gallery.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this photo from the homepage gallery?")) return;

    const res = await fetch(`/api/admin/homepage-gallery/${id}`, { method: "DELETE" });

    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Homepage Gallery"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Homepage Gallery" },
        ]}
      />

      <p className={styles.subtitle}>
        Photos uploaded here scroll across the &quot;Gallery&quot; section on
        the public homepage.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Photo</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div>
          <label>Caption (optional)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Summit Day"
          />
        </div>

        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={uploading}>
          <UploadCloud size={15} /> {uploading ? "Uploading..." : "Add Photo"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <Images size={17} /> On the Homepage ({photos.length})
        </h3>

        {photos.length === 0 ? (
          <div className={styles.empty}>No photos uploaded yet.</div>
        ) : (
          <div className={styles.list}>
            {photos.map((photo) => (
              <div key={photo.id} className={styles.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imageUrl} alt="" className={styles.thumb} />

                <div className={styles.rowInfo}>
                  <span>{photo.caption || "No caption"}</span>
                </div>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(photo.id)}
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>New photos are added to the end of the strip.</p>
    </div>
  );
}
