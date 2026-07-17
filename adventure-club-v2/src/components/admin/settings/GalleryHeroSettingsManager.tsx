"use client";

import { useRef, useState } from "react";
import { Save } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./GalleryHeroSettingsManager.module.scss";

type GalleryHeroSettings = {
  imageUrl: string;
  heading: string;
  subtitle: string;
  buttonText: string | null;
  buttonLink: string | null;
} | null;

export default function GalleryHeroSettingsManager({
  initialSettings,
}: {
  initialSettings: GalleryHeroSettings;
}) {
  const [heading, setHeading] = useState(initialSettings?.heading || "");
  const [subtitle, setSubtitle] = useState(initialSettings?.subtitle || "");
  const [buttonText, setButtonText] = useState(initialSettings?.buttonText || "");
  const [buttonLink, setButtonLink] = useState(initialSettings?.buttonLink || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialSettings?.imageUrl || "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!heading.trim() || !subtitle.trim()) {
      setStatus("Enter a heading and subtitle.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("heading", heading.trim());
      form.append("subtitle", subtitle.trim());
      form.append("buttonText", buttonText.trim());
      form.append("buttonLink", buttonLink.trim());
      if (imageFile) form.append("imageFile", imageFile);

      const res = await fetch("/api/admin/settings/gallery-hero", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save.");
        return;
      }

      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setStatus("Gallery page hero updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Gallery Page Hero"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Gallery" },
        ]}
      />

      <p className={styles.subtitle}>
        The banner shown at the top of the public <strong>/gallery</strong> page.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Hero Image</label>
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

        <div>
          <label>Heading</label>
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Moments From Every Adventure."
          />
        </div>

        <div>
          <label>Subtitle</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Every trek leaves behind more than memories..."
          />
        </div>

        <div className={styles.row2}>
          <div>
            <label>Button Text (optional)</label>
            <input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="e.g. Join Adventure Club"
            />
          </div>

          <div>
            <label>Button Link (optional)</label>
            <input
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              placeholder="e.g. /signup"
            />
          </div>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={saving}>
          <Save size={15} /> {saving ? "Saving..." : "Save Hero"}
        </button>
      </form>
    </div>
  );
}
