"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GalleryPhoto } from "@/types/homepage";
import styles from "./Gallery.module.scss";

export default function GalleryLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const item = items[index];

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowLeft") {
        onNavigate((index - 1 + items.length) % items.length);
        return;
      }

      if (e.key === "ArrowRight") {
        onNavigate((index + 1) % items.length);
        return;
      }

      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;

        const list = Array.from(focusables);
        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, items.length, onClose, onNavigate]);

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={item.alt}
        className={styles.dialog}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {items.length > 1 && (
          <button
            type="button"
            className={`${styles.navArrow} ${styles.navPrev}`}
            onClick={() => onNavigate((index - 1 + items.length) % items.length)}
            aria-label="Previous image"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <div className={styles.imageWrap}>
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="90vw"
            className={styles.lightboxImage}
          />
        </div>

        {items.length > 1 && (
          <button
            type="button"
            className={`${styles.navArrow} ${styles.navNext}`}
            onClick={() => onNavigate((index + 1) % items.length)}
            aria-label="Next image"
          >
            <ChevronRight size={26} />
          </button>
        )}

        {item.caption && <p className={styles.caption}>{item.caption}</p>}
      </motion.div>
    </motion.div>
  );
}
