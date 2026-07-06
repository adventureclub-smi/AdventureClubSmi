"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Compass } from "lucide-react";

import type { GalleryPhoto } from "@/types/homepage";
import GalleryLightbox from "./GalleryLightbox";
import styles from "./Gallery.module.scss";

export default function Gallery({ items }: { items: GalleryPhoto[] }) {
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function openLightbox(trackIndex: number) {
    openerRef.current = thumbRefs.current[trackIndex];
    setOpenIndex(trackIndex);
  }

  function closeLightbox() {
    setOpenIndex(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <section className={styles.gallery} id="gallery">
      <div className={styles.headingWrap}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.eyebrow}>GALLERY</span>
          <h2>Adventure Gallery.</h2>
        </motion.div>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <Compass size={30} />
          <h3>Photos Coming Soon</h3>
          <p>The gallery is being put together. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.marqueeViewport}>
          {/* The strip is rendered twice back-to-back so the CSS animation
              can loop seamlessly from translateX(0) to translateX(-50%). */}
          <div
            className={styles.marqueeTrack}
            style={{ animationDuration: `${Math.max(24, items.length * 3.5)}s` }}
          >
            {[...items, ...items].map((item, i) => (
              <button
                key={`${item.id}-${i}`}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                className={`${styles.tile} ${i % 2 === 0 ? styles.tiltLeft : styles.tiltRight}`}
                onClick={() => openLightbox(i)}
                aria-label={`View photo: ${item.alt}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 700px) 45vw, 260px"
                  className={styles.media}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox
            items={items}
            index={openIndex % items.length}
            onClose={closeLightbox}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
