"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./StoryScenes.module.scss";

const AUTO_ADVANCE_MS = 5500;

type Scene = {
  id: string;
  image: string;
  alt: string;
  caption: string;
};

// ===== EDIT ME: drop new scene art in /public/images/stories and add it
// here.
const SCENES: Scene[] = [
  {
    id: "campfire",
    image: "/images/stories/campfire.png",
    alt: "The group sitting around a campfire at night, lit by the fire's glow",
    caption: "Cold cup noodles?",
  },
];

export default function StoryScenes() {
  const [index, setIndex] = useState(0);
  const hasMultiple = SCENES.length > 1;

  const goTo = useCallback((i: number) => {
    setIndex(((i % SCENES.length) + SCENES.length) % SCENES.length);
  }, []);

  useEffect(() => {
    if (!hasMultiple) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCENES.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [index, hasMultiple]);

  const scene = SCENES[index];

  return (
    <div className={styles.stage}>
      {hasMultiple && (
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goTo(index - 1)}
          aria-label="Previous scene"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div className={styles.frameWrap}>
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            className={styles.frame}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={scene.image}
              alt={scene.alt}
              fill
              sizes="(max-width: 700px) 100vw, 900px"
              className={styles.image}
              priority
            />

            <div className={styles.bubbleAnchor}>
              <motion.div
                className={styles.bubble}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {scene.caption}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {hasMultiple && (
          <div className={styles.dots}>
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => goTo(i)}
                aria-label={`Go to scene ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {hasMultiple && (
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goTo(index + 1)}
          aria-label="Next scene"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
