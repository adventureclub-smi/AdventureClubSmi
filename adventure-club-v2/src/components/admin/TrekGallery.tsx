"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";

import styles from "./TrekGallery.module.scss";

type GalleryImage = {
  id: string;
  imageUrl: string;
  createdAt: string;
};

export default function TrekGallery({ trekId }: { trekId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/gallery/${trekId}`);
        if (!res.ok || !active) return;
        setImages(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upload = await uploadRes.json();

      if (!uploadRes.ok) return;

      const res = await fetch(`/api/admin/gallery/${trekId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: upload.url }),
      });

      if (res.ok) {
        const image = await res.json();
        setImages((prev) => [image, ...prev]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    const confirmDelete = confirm("Remove this photo from the gallery?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/admin/gallery/${trekId}/${imageId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  }

  if (loading) return <p className={styles.hint}>Loading gallery...</p>;

  return (
    <div className={styles.container}>
      <input
        hidden
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleUpload}
      />

      <button
        className={styles.uploadButton}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <ImagePlus size={16} />
        {uploading ? "Uploading..." : "Upload Photo"}
      </button>

      {images.length === 0 ? (
        <div className={styles.empty}>No photos uploaded yet for this trek.</div>
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <div key={image.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={image.imageUrl}
                  alt="Trek gallery"
                  fill
                  sizes="220px"
                  className={styles.image}
                />
              </div>

              <button className={styles.delete} onClick={() => handleDelete(image.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
