"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { useTilt } from "@/hooks/useTilt";
import type { GalleryPhoto } from "@/types/homepage";
import styles from "./GalleryMasonryGrid.module.scss";

export default function GalleryGridItem({
  photo,
  index,
  onOpen,
}: {
  photo: GalleryPhoto;
  index: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const tilt = useTilt(ref, 6);

  return (
    <motion.button
      ref={ref}
      type="button"
      className={styles.item}
      style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...tilt.style }}
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 15) * 0.04 }}
      onClick={onOpen}
      aria-label={`View photo: ${photo.alt}`}
      {...tilt.handlers}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 700px) 50vw, 25vw"
        className={styles.image}
      />
    </motion.button>
  );
}
