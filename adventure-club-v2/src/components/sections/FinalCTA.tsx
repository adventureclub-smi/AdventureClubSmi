"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { useLazyVideo } from "@/hooks/useLazyVideo";
import type { FinalSectionContent } from "@/types/homepage";
import styles from "./FinalCTA.module.scss";

// Three.js touches the GPU/canvas — never render it on the server.
const AmbientField = dynamic(() => import("@/components/three/AmbientField"), {
  ssr: false,
});

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
  const [isMobile, setIsMobile] = useState(false);

  // Pauses the ambient field's render loop once scrolled well past this
  // section, instead of letting it run for the rest of the page's lifetime.
  const sceneInView = useInView(ref, { margin: "300px" });

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

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
            poster={content.imageUrl}
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

      <div className={styles.embers} aria-hidden="true">
        <AmbientField
          animate={!reducedMotion && sceneInView}
          isMobile={isMobile}
          density={0.7}
          shapes={false}
          color="#fff6da"
          size={4}
          opacity={0.85}
        />
      </div>

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
