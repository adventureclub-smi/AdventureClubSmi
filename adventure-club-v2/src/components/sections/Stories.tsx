"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Story } from "@/types/homepage";
import styles from "./Stories.module.scss";

const alignments = ["left", "center", "right"] as const;

export default function Stories({ stories }: { stories: Story[] }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);

  const visible = stories
    .filter((story) => story.published)
    .sort((a, b) => a.order - b.order);

  return (
    <section className={styles.stories} id="stories">
      <motion.div
        className={styles.container}
        ref={revealRef}
        style={revealStyle}
      >
        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.eyebrow}>STORIES</span>
          <h2>Every Journey Leaves A Mark.</h2>
        </motion.div>

        <div className={styles.list}>
          {visible.map((story, i) => {
            const align = alignments[i % alignments.length];
            const media = story.media[0];

            return (
              <motion.div
                key={story.id}
                className={`${styles.story} ${styles[align]}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.9, delay: (i % 3) * 0.1 }}
              >
                {media && (
                  <div className={styles.media}>
                    {media.type === "video" ? (
                      <video
                        src={media.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={media.src}
                        alt={story.title}
                        fill
                        sizes="140px"
                      />
                    )}
                  </div>
                )}

                <div className={styles.text}>
                  <p className={styles.quote}>&ldquo;{story.title}&rdquo;</p>
                  <p className={styles.description}>{story.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
