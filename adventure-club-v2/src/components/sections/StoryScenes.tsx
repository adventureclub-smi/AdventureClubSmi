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
  width: number;
  height: number;
  // Percent-of-image position of the light source (fire/lantern/etc.) this
  // scene should flicker and emit embers from — omit for scenes with no
  // such light source.
  firePosition?: { xPct: number; yPct: number };
  // Only needed when the caption isn't already drawn into the artwork
  // itself — rendered as a floating speech-bubble overlay instead.
  caption?: string;
};

// ===== EDIT ME: drop new scene art in /public/images/stories and add it
// here. width/height should match the source file's real pixel dimensions
// (Next.js needs them to avoid layout shift) — these are transparent PNGs
// rendered at their natural size, not cropped into a fixed frame.
const SCENES: Scene[] = [
  {
    id: "campfire",
    image: "/images/stories/campfire.png",
    alt: "The group sitting around a glowing campfire at night, one person holding a cup of cold noodles",
    width: 1536,
    height: 1024,
    firePosition: { xPct: 50, yPct: 58 },
  },
  {
    id: "tree",
    image: "/images/stories/tree.png",
    alt: "One person hanging from a tree branch, still trying to climb the giant glowing tree",
    width: 1536,
    height: 1024,
    caption: "We reached the top but still couldn't climb the tree",
  },
];

const EMBER_OFFSETS = [-18, -6, 4, 14, 24];

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
            animate={{ opacity: 1, scale: [1, 1.018, 1] }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.5 } }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Image
              src={scene.image}
              alt={scene.alt}
              width={scene.width}
              height={scene.height}
              sizes="(max-width: 700px) 100vw, 900px"
              className={styles.image}
              priority
            />

            {scene.firePosition && (
              <>
                <motion.div
                  className={styles.fireGlow}
                  style={{ left: `${scene.firePosition.xPct}%`, top: `${scene.firePosition.yPct}%` }}
                  animate={{ opacity: [0.85, 1, 0.9, 1, 0.85], scale: [1, 1.15, 1, 1.1, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />

                {EMBER_OFFSETS.map((offsetX, i) => (
                  <motion.div
                    key={i}
                    className={styles.ember}
                    style={{
                      left: `calc(${scene.firePosition!.xPct}% + ${offsetX}px)`,
                      top: `${scene.firePosition!.yPct}%`,
                    }}
                    animate={{ y: [0, -90 - i * 8], opacity: [0, 0.9, 0], x: [0, i % 2 === 0 ? 14 : -14] }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}

            {scene.caption && (
              <div className={styles.bubbleAnchor}>
                <motion.div
                  className={styles.bubble}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {scene.caption}
                </motion.div>
              </div>
            )}
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
