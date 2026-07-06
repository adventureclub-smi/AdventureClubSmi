"use client";

import { useRef, useState } from "react";
import { Camera, Send, Trash2 } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./InstagramManager.module.scss";

type InstagramPost = {
  id: string;
  postUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

export default function InstagramManager({
  initialPosts,
}: {
  initialPosts: InstagramPost[];
}) {
  const [posts, setPosts] = useState<InstagramPost[]>(initialPosts);
  const [postUrl, setPostUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file for the thumbnail.");
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setStatus("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!postUrl.trim() || !thumbnailFile) {
      setStatus("The post link and a thumbnail image are both required.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("postUrl", postUrl.trim());
      form.append("caption", caption.trim());
      form.append("thumbnailFile", thumbnailFile);

      const res = await fetch("/api/admin/instagram", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add post.");
        return;
      }

      setPosts((prev) => [data, ...prev]);
      setPostUrl("");
      setCaption("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      setStatus("Post added to the homepage feed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this post from the homepage feed?")) return;

    const res = await fetch(`/api/admin/instagram/${id}`, { method: "DELETE" });

    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Instagram"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Instagram" },
        ]}
      />

      <p className={styles.subtitle}>
        Whenever the club posts something new on{" "}
        <a
          href="https://www.instagram.com/adventure_smi"
          target="_blank"
          rel="noopener noreferrer"
        >
          @adventure_smi
        </a>
        , paste that post&apos;s link and a thumbnail image here to show it on
        the homepage.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Post Link</label>
          <input
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/XXXXXXXXX/"
          />
          <small>
            Open the post on Instagram → Share → Copy Link, then paste it here.
          </small>
        </div>

        <div>
          <label>Thumbnail Image</label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
          />
          <small>
            Save the post&apos;s photo (or take a screenshot) and upload it —
            this is what shows on the homepage carousel.
          </small>
        </div>

        <div>
          <label>Caption Override (optional)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Leave blank to use the post's own caption"
          />
        </div>

        {thumbnailPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailPreview} alt="Thumbnail preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={saving}>
          <Send size={15} /> {saving ? "Adding..." : "Add Post"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <Camera size={17} /> On the Homepage ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <div className={styles.empty}>No Instagram posts added yet.</div>
        ) : (
          <div className={styles.list}>
            {posts.map((post) => (
              <div key={post.id} className={styles.row}>
                {post.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnailUrl} alt="" className={styles.thumb} />
                )}

                <div className={styles.rowInfo}>
                  <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                    {post.postUrl}
                  </a>
                  {post.caption && <span>{post.caption}</span>}
                </div>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(post.id)}
                  aria-label="Remove post"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
