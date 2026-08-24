"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Camera, Trash2, ImagePlus } from "lucide-react";

import GalleryLightbox from "@/components/sections/GalleryLightbox";
import type { GalleryPhoto } from "@/types/homepage";
import styles from "./TrekPhotosSection.module.scss";

type TrekPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  caption: string | null;
  uploadedByName: string;
  isOwn: boolean;
};

export default function TrekPhotosSection({
  trekId,
  registrationId,
  canUpload,
}: {
  trekId: string;
  registrationId: string;
  canUpload: boolean;
}) {
  const [photos, setPhotos] = useState<TrekPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const res = await fetch(`/api/trek-photos/${trekId}`);
      if (res.ok) setPhotos(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trekId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/student/trek-photos/${registrationId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.message || "Failed to upload photo.");
        return;
      }

      await load();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    const confirmed = window.confirm("Remove this photo?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/student/trek-photos/photo/${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setOpenIndex(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const lightboxItems: GalleryPhoto[] = photos.map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.caption || `Photo by ${photo.uploadedByName}`,
    caption: photo.caption || `Uploaded by ${photo.uploadedByName}`,
    width: photo.width,
    height: photo.height,
  }));

  if (loading) return null;

  // Nothing to show and nobody who can add anything yet — no point taking
  // up space on the journey page for a trek nobody's uploaded to.
  if (photos.length === 0 && !canUpload) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3>
          <Camera size={16} /> Trek Photos
        </h3>

        {canUpload && (
          <>
            <input
              hidden
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleUpload}
            />
            <button
              type="button"
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus size={14} />
              {uploading ? "Uploading..." : "Add Photo"}
            </button>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <p className={styles.empty}>
          No photos yet — be the first to share one from this trek.
        </p>
      ) : (
        <div className={styles.grid}>
          {photos.map((photo, index) => (
            <div key={photo.id} className={styles.tile}>
              <button
                type="button"
                className={styles.tileButton}
                onClick={() => setOpenIndex(index)}
              >
                <Image
                  src={photo.src}
                  alt={photo.caption || `Photo by ${photo.uploadedByName}`}
                  fill
                  sizes="(max-width: 700px) 33vw, 160px"
                  className={styles.image}
                />
              </button>

              {photo.isOwn && (
                <button
                  type="button"
                  className={styles.delete}
                  onClick={() => handleDelete(photo.id)}
                  aria-label="Remove photo"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox
            items={lightboxItems}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
