"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Memory } from "./MemoryData";
import styles from "./StoryModal.module.scss";

export default function StoryModal({
  memory,
  onClose,
}: {
  memory: Memory | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {memory && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>

            <div className={styles.hero}>
              <span className={styles.heroEmoji}>{memory.emoji}</span>
            </div>

            <div className={styles.body}>
              <p className={styles.eyebrow}>
                {memory.location} • {memory.date}
              </p>
              <h2>{memory.title}</h2>

              <p className={styles.story}>{memory.story}</p>

              {memory.photos.length > 0 && (
                <div className={styles.gallery}>
                  {memory.photos.map((photo, i) => (
                    <div key={i} className={styles.photoFrame}>
                      <Image src={photo} alt="" fill sizes="200px" />
                    </div>
                  ))}
                </div>
              )}

              {memory.quotes.length > 0 && (
                <div className={styles.quotes}>
                  {memory.quotes.map((quote, i) => (
                    <p key={i}>{quote}</p>
                  ))}
                </div>
              )}

              <p className={styles.people}>
                <strong>Who was there: </strong>
                {memory.people.join(", ")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
