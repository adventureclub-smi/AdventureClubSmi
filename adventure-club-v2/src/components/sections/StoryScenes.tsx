"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryScene } from "@/types/homepage";
import styles from "./StoryScenes.module.scss";

const AUTO_ADVANCE_MS = 7000;

export default function StoryScenes({ scenes }: { scenes: StoryScene[] }) {
  const [index, setIndex] = useState(0);
  const hasMultiple = scenes.length > 1;

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % scenes.length) + scenes.length) % scenes.length);
    },
    [scenes.length]
  );

  useEffect(() => {
    if (!hasMultiple) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % scenes.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [index, hasMultiple, scenes.length]);

  if (scenes.length === 0) return null;

  const scene = scenes[index];

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
            animate={{ opacity: 1, scale: [1, 1.018, 1] }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 2.5, ease: "easeInOut" } }}
            transition={{
              opacity: { duration: 2.5, ease: "easeInOut" },
              scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div className={styles.imageWrap}>
              <Image
                src={scene.imageUrl}
                alt={scene.caption || "Trek story scene"}
                width={scene.imageWidth}
                height={scene.imageHeight}
                sizes="(max-width: 700px) 100vw, 1000px"
                className={styles.image}
                priority
              />

              {(scene.caption || scene.description) && (
                <div className={styles.textOverlay}>
                  {scene.caption && <p className={styles.caption}>{scene.caption}</p>}
                  {scene.description && (
                    <p className={styles.description}>{scene.description}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {hasMultiple && (
          <div className={styles.dots}>
            {scenes.map((s, i) => (
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
