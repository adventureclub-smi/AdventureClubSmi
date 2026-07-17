"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";

import type { GalleryPhoto } from "@/types/homepage";
import GalleryLightbox from "@/components/sections/GalleryLightbox";
import styles from "./GalleryMasonryGrid.module.scss";

export default function GalleryMasonryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(photos.map((p) => p.category).filter((c): c is string => Boolean(c)))
    );
    return ["All", ...unique];
  }, [photos]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  if (photos.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.empty}>
          <Compass size={30} />
          <h3>Photos Coming Soon</h3>
          <p>The gallery is being put together. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      {categories.length > 1 && (
        <div className={styles.tabs}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? styles.tabActive : styles.tab}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className={styles.grid}>
        {filtered.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            className={styles.item}
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            onClick={() => setOpenIndex(i)}
            aria-label={`View photo: ${photo.alt}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 700px) 50vw, 25vw"
              className={styles.image}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox
            items={filtered}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
