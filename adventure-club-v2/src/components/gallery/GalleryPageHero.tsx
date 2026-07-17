"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useMouseParallax } from "@/hooks/useMouseParallax";
import type { GalleryHeroContent } from "@/types/homepage";
import styles from "./GalleryPageHero.module.scss";

export default function GalleryPageHero({ content }: { content: GalleryHeroContent }) {
  const heroRef = useRef<HTMLElement>(null);
  const parallax = useMouseParallax(heroRef, 24);

  return (
    <section className={styles.hero} ref={heroRef} {...parallax.handlers}>
      <motion.div className={styles.imageLayer} style={parallax.style}>
        <Image
          src={content.imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
      </motion.div>

      <div className={styles.overlay} />

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className={styles.eyebrow}>GALLERY</span>
        <h1>{content.heading}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>

        {content.buttonText && content.buttonLink && (
          <Link href={content.buttonLink} className={styles.button}>
            {content.buttonText}
            <ArrowRight size={16} />
          </Link>
        )}
      </motion.div>
    </section>
  );
}
