"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, useReducedMotion } from "framer-motion";

import type { GalleryPhoto } from "@/types/homepage";
import GalleryLightbox from "@/components/sections/GalleryLightbox";
import styles from "./GalleryOrbitGallery.module.scss";

// Three.js touches the GPU/canvas — never render it on the server, and only
// pull the (fairly heavy) three.js bundle in once the browser needs it.
const GalleryOrbitScene = dynamic(() => import("@/components/three/GalleryOrbitScene"), {
  ssr: false,
});

// A sphere with too many nodes on it starts looking cluttered rather than
// premium, and each one is its own texture upload — capped well below the
// full gallery.
const MAX_NODES = 24;

export default function GalleryOrbitGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  const items = photos.slice(0, MAX_NODES);

  // A sphere of 1-2 photos doesn't read as a sphere — not worth the section.
  if (items.length < 4) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.kicker}>In three dimensions</div>
        <h2>
          Every trip.<br />
          <span>One orbit.</span>
        </h2>
        <p>Drag to spin the sphere, click any photo to open it full size.</p>
      </div>

      <div className={styles.stage}>
        <GalleryOrbitScene photos={items} onSelect={setOpenIndex} autoRotate={!reducedMotion} />
        <span className={styles.hint}>Drag to orbit ↻</span>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox
            items={items}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
