"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { StoryScene } from "@/types/homepage";
import styles from "./StoryScenes.module.scss";

export default function StoryScenes({ scenes }: { scenes: StoryScene[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (scenes.length === 0) return null;

  const openScene = scenes.find((s) => s.id === openId) || null;

  return (
    <div className={styles.stage}>
      <div className={styles.branch} aria-hidden="true" />

      <div className={styles.row}>
        {scenes.map((scene, i) => {
          const restRotate = i % 2 === 0 ? -3 : 3;
          const isOpen = scene.id === openId;

          return (
            <div className={styles.hangItem} key={scene.id}>
              <div className={styles.clip} aria-hidden="true" />

              <motion.div
                className={styles.swayWrap}
                animate={isOpen ? { rotate: 0 } : { rotate: [restRotate, -restRotate, restRotate] }}
                transition={
                  isOpen
                    ? { duration: 0.3 }
                    : { duration: 4.5 + (i % 3) * 0.6, repeat: Infinity, ease: "easeInOut" }
                }
              >
                {isOpen ? (
                  <div className={styles.polaroidPlaceholder} aria-hidden="true" />
                ) : (
                  <motion.button
                    type="button"
                    layoutId={`polaroid-${scene.id}`}
                    className={styles.polaroid}
                    onClick={() => setOpenId(scene.id)}
                  >
                    <div className={styles.photoArea}>
                      <Image
                        src={scene.imageUrl}
                        alt={scene.caption || "Trek story scene"}
                        fill
                        sizes="200px"
                        style={{ objectFit: "cover" }}
                      />
                      {scene.caption && <p className={styles.headline}>{scene.caption}</p>}
                    </div>
                  </motion.button>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {openScene && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={() => setOpenId(null)}
          >
            <motion.div
              layoutId={`polaroid-${openScene.id}`}
              className={styles.polaroidLarge}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpenId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className={styles.photoAreaLarge}>
                <Image
                  src={openScene.imageUrl}
                  alt={openScene.caption || "Trek story scene"}
                  fill
                  sizes="(max-width: 700px) 90vw, 560px"
                  style={{ objectFit: "cover" }}
                  priority
                />
                {openScene.caption && (
                  <p className={styles.headlineLarge}>{openScene.caption}</p>
                )}
              </div>

              {openScene.description && (
                <p className={styles.descriptionLarge}>{openScene.description}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
