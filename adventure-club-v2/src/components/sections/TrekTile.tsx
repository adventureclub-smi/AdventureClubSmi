"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { TrekSummary } from "@/types/homepage";
import styles from "./TrekTile.module.scss";

export default function TrekTile({
  trek,
  index,
}: {
  trek: TrekSummary;
  index: number;
}) {
  return (
    <motion.div
      className={styles.tile}
      style={{ zIndex: index }}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1 }}
      whileHover={{ y: -14, zIndex: 20 }}
    >
      <Link href={`/treks/${trek.id}`} className={styles.link}>
        <div className={styles.imageWrap}>
          <Image
            src={trek.coverImage}
            alt={trek.title}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            className={styles.image}
          />
          <div className={styles.overlay} />

          <span className={styles.difficulty}>{trek.difficulty}</span>
          <span
            className={
              trek.seatsLeft > 0 ? styles.availability : styles.full
            }
          >
            {trek.seatsLeft > 0 ? `${trek.seatsLeft} left` : "Full"}
          </span>

          <div className={styles.content}>
            <p className={styles.destination}>{trek.destination}</p>
            <h3>{trek.title}</h3>

            <div className={styles.bottom}>
              <div>
                <p className={styles.date}>
                  {new Date(trek.date).toLocaleDateString()}
                </p>
                <h4>₹{trek.price}</h4>
              </div>

              <span className={styles.register}>Register →</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
