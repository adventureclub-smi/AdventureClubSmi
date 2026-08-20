"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

import type { GalleryPhoto } from "@/types/homepage";
import styles from "./GalleryScrollStory.module.scss";

// How many photos take part in the scrubbed sequence — kept small since
// each one gets its own full-viewport-height scroll segment (6 photos =
// 6x viewport height of scroll track for this section alone).
const STORY_LENGTH = 6;

// Extra scroll track after the last image reaches full opacity, as a
// fraction of one image's segment — gives the final frame a "coast" zone to
// sit at rest in before this section's position: sticky detaches, instead
// of that detach point landing exactly on frame's own transform boundary.
const TAIL_BUFFER = 0.2;

function StoryFrame({
  photo,
  index,
  active,
  reduceMotion,
}: {
  photo: GalleryPhoto;
  index: number;
  active: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // `active` is a single continuous position through the sequence (0 at the
  // first image, total-1 at the last, clamped either side) — every frame
  // derives its own opacity/zoom from the same value with a plain function
  // instead of its own independent keyframe array, so there's nothing
  // structurally different about the first/last frame for a scroll-library
  // edge case to catch on.
  const opacity = useTransform(active, (value) => Math.max(0, 1 - Math.abs(value - index)));

  // Continuous "Ken Burns" zoom scrubbed to scroll position within this
  // image's own active window — scrolling back up unwinds it smoothly since
  // it's a direct transform of scroll position, not a one-shot animation.
  const scale = useTransform(active, (value) => {
    if (reduceMotion) return 1;
    const local = Math.min(1, Math.max(0, value - index));
    return 1 + local * 0.16;
  });

  return (
    <motion.div className={styles.frame} style={{ opacity }}>
      <motion.div className={styles.imageWrap} style={{ scale }}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          priority={index === 0}
          className={styles.image}
        />
      </motion.div>

      {(photo.caption || photo.category) && (
        <div className={styles.caption}>
          {photo.category && <span className={styles.captionTag}>{photo.category}</span>}
          {photo.caption && <p>{photo.caption}</p>}
        </div>
      )}
    </motion.div>
  );
}

function ProgressDot({ index, active }: { index: number; active: MotionValue<number> }) {
  const opacity = useTransform(active, (value) =>
    Math.max(0.35, 1 - Math.abs(value - index) * 0.65)
  );

  return <motion.span className={styles.dot} style={{ opacity }} />;
}

export default function GalleryScrollStory({ photos }: { photos: GalleryPhoto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = !!useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const images = photos.slice(0, STORY_LENGTH);

  // Both hooks below need to run unconditionally on every render regardless
  // of image count — the "not enough photos" bailout only skips the JSX,
  // further down, once these are already called.
  const trackFraction = images.length > 1 ? images.length / (images.length + TAIL_BUFFER) : 1;
  const active = useTransform(scrollYProgress, (value) =>
    Math.min(Math.max(1, images.length - 1), (value / trackFraction) * Math.max(1, images.length - 1))
  );
  const hintOpacity = useTransform(scrollYProgress, (value) => Math.max(0, 1 - value / 0.05));

  // Needs a real scroll track to scrub against — not worth the section at all
  // with only one photo to show.
  if (images.length < 2) return null;

  return (
    <section
      className={styles.story}
      ref={containerRef}
      style={{ height: `${(images.length + TAIL_BUFFER) * 100}vh` }}
    >
      <div className={styles.sticky}>
        {images.map((photo, index) => (
          <StoryFrame
            key={photo.id}
            photo={photo}
            index={index}
            active={active}
            reduceMotion={reduceMotion}
          />
        ))}

        <div className={styles.overlay} />

        <motion.p className={styles.hint} style={{ opacity: hintOpacity }}>
          Scroll to explore ↓
        </motion.p>

        <div className={styles.progress}>
          {images.map((photo, index) => (
            <ProgressDot key={photo.id} index={index} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
