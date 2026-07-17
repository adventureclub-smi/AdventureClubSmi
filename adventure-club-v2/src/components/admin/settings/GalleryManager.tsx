"use client";

import { useRef, useState } from "react";
import { Images, Pencil, Trash2, UploadCloud, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./GalleryManager.module.scss";

type GalleryPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
};

export default function GalleryManager({
  initialPhotos,
}: {
  initialPhotos: GalleryPhoto[];
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
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

  function startEdit(photo: GalleryPhoto) {
    setEditingId(photo.id);
    setCaption(photo.caption || "");
    setCategory(photo.category || "");
    setImageFile(null);
    setImagePreview(photo.imageUrl);
    setStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setCaption("");
    setCategory("");
    setImageFile(null);
    setImagePreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    setStatus("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId && !imageFile) {
      setStatus("Please choose a photo to upload.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("caption", caption.trim());
      form.append("category", category.trim());
      if (imageFile) form.append("imageFile", imageFile);

      const res = await fetch(
        editingId ? `/api/admin/homepage-gallery/${editingId}` : "/api/admin/homepage-gallery",
        { method: editingId ? "PATCH" : "POST", body: form }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save photo.");
        return;
      }

      setPhotos((prev) =>
        editingId ? prev.map((p) => (p.id === editingId ? data : p)) : [...prev, data]
      );

      setStatus(editingId ? "Photo updated." : "Photo added to the gallery.");
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this photo from the gallery?")) return;

    const res = await fetch(`/api/admin/homepage-gallery/${id}`, { method: "DELETE" });

    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) cancelEdit();
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Gallery Photos"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Gallery" },
        ]}
      />

      <p className={styles.subtitle}>
        Photos added here appear on the public <strong>/gallery</strong> page, filterable
        by category.
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

        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className={styles.preview} />
        )}

        <div className={styles.row2}>
          <div>
            <label>Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Trekking"
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
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <div className={styles.formButtons}>
          <button type="submit" disabled={saving}>
            <UploadCloud size={15} />
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Photo"}
          </button>

          {editingId && (
            <button type="button" className={styles.cancelButton} onClick={cancelEdit}>
              <X size={15} /> Cancel
            </button>
          )}
        </div>
      </form>

      <section className={styles.section}>
        <h3>
          <Images size={17} /> In The Gallery ({photos.length})
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
                  {photo.category && <small>{photo.category}</small>}
                </div>

                <div className={styles.rowActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => startEdit(photo)}
                    aria-label="Edit photo"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(photo.id)}
                    aria-label="Remove photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>New photos are added to the end of the gallery.</p>
    </div>
  );
}
