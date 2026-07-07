"use client";

import { useRef, useState } from "react";
import { BookOpen, UploadCloud, Trash2 } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./StoriesManager.module.scss";

type HomepageStory = {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
};

export default function StoriesManager({
  initialStories,
}: {
  initialStories: HomepageStory[];
}) {
  const [stories, setStories] = useState<HomepageStory[]>(initialStories);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

    if (!title.trim() || !description.trim()) {
      setStatus("Enter a tag line and a one-line description.");
      return;
    }

    if (!imageFile) {
      setStatus("Please choose a picture to upload.");
      return;
    }

    setUploading(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("imageFile", imageFile);

      const res = await fetch("/api/admin/stories", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add story.");
        return;
      }

      setStories((prev) => [...prev, data]);
      setTitle("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      setStatus("Story added to the homepage.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this story from the homepage?")) return;

    const res = await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });

    if (res.ok) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Stories"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Stories" },
        ]}
      />

      <p className={styles.subtitle}>
        Stories added here appear in the &quot;Every Journey Leaves A
        Mark.&quot; section on the public homepage.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Picture</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div>
          <label>Tag Line</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. We left as strangers."
          />
        </div>

        <div>
          <label>One Line About It</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Twelve of us boarded a bus before sunrise..."
          />
        </div>

        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={uploading}>
          <UploadCloud size={15} /> {uploading ? "Uploading..." : "Add Story"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <BookOpen size={17} /> On the Homepage ({stories.length})
        </h3>

        {stories.length === 0 ? (
          <div className={styles.empty}>No stories added yet.</div>
        ) : (
          <div className={styles.list}>
            {stories.map((story) => (
              <div key={story.id} className={styles.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.imageUrl} alt="" className={styles.thumb} />

                <div className={styles.rowInfo}>
                  <strong>{story.title}</strong>
                  <span>{story.description}</span>
                </div>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(story.id)}
                  aria-label="Remove story"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>New stories are added to the end of the section.</p>
    </div>
  );
}
