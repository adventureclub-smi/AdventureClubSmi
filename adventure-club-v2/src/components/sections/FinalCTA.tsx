"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { useLazyVideo } from "@/hooks/useLazyVideo";
import type { FinalSectionContent } from "@/types/homepage";
import styles from "./FinalCTA.module.scss";

export default function FinalCTA({
  content,
}: {
  content: FinalSectionContent;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useLazyVideo(videoRef);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end center"],
  });

  const reducedMotion = useReducedMotion();

  const brightness = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  const filter = useMotionTemplate`brightness(${brightness})`;
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.9, 0.45]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <section className={styles.cta} ref={ref} id="join">
      <motion.div className={styles.bg} style={{ filter }}>
        {content.videoUrl ? (
          <video
            ref={videoRef}
            className={styles.image}
            src={content.videoUrl}
            muted
            loop
            playsInline
            preload="none"
          />
        ) : (
          <Image
            src={content.imageUrl}
            alt=""
            fill
            sizes="100vw"
            className={styles.image}
          />
        )}
      </motion.div>

      <motion.div
        className={styles.overlay}
        style={{ opacity: overlayOpacity }}
      />

      <motion.div
        className={styles.content}
        style={reducedMotion ? undefined : { scale: contentScale }}
      >
        <motion.span
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          FINAL CHAPTER
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >
          {content.heading.map((line, i) => (
            <span key={i}>
              {line}
              {i < content.heading.length - 1 && <br />}
            </span>
          ))}
        </motion.h2>

        <motion.p
          className={styles.description}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {content.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link href={content.ctaHref} className={styles.button}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className={styles.buttonInner}
            >
              {content.ctaLabel}
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
