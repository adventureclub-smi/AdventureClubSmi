"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useInView } from "framer-motion";
import { Compass } from "lucide-react";

import type { GalleryPhoto } from "@/types/homepage";
import GalleryLightbox from "@/components/sections/GalleryLightbox";
import GalleryGridItem from "./GalleryGridItem";
import styles from "./GalleryMasonryGrid.module.scss";

const BATCH_SIZE = 15;

export default function GalleryMasonryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(photos.map((p) => p.category).filter((c): c is string => Boolean(c)))
    );
    return ["All", ...unique];
  }, [photos]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  // Only the first batch downloads up front — every fresh visit to a
  // photo-heavy page like this one otherwise pays for every single image,
  // most of which nobody scrolls far enough to see.
  const visible = filtered.slice(0, visibleCount);

  function switchCategory(category: string) {
    setActiveCategory(category);
    setVisibleCount(BATCH_SIZE);
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const sentinelInView = useInView(sentinelRef, { margin: "400px" });

  useEffect(() => {
    function loadNextBatch() {
      if (sentinelInView && visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filtered.length));
      }
    }
    loadNextBatch();
  }, [sentinelInView, filtered.length, visibleCount]);

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
              onClick={() => switchCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className={styles.grid}>
        {visible.map((photo, i) => (
          <GalleryGridItem
            key={photo.id}
            photo={photo}
            index={i}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>

      {visibleCount < filtered.length && <div ref={sentinelRef} className={styles.sentinel} />}

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox
            items={visible}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
