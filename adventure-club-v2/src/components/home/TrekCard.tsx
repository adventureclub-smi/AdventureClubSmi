"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./TrekCard.module.scss";

type Trek = {
  id: string;
  title: string;
  destination: string;
  difficulty: string;
  date: string;
  price: number;
  coverImage: string;
};

export default function TrekCard({
  trek,
}: {
  trek: Trek;
}) {
  return (
    <Link
      href={`/treks/${trek.id}`}
      className={styles.card}
    >
      <div className={styles.imageContainer}>
        <Image
          src={trek.coverImage}
          alt={trek.title}
          fill
          className={styles.image}
        />

        <div className={styles.overlay} />

        <span className={styles.difficulty}>
          🥾 {trek.difficulty}
        </span>

        <div className={styles.content}>
          <p className={styles.destination}>
            📍 {trek.destination}
          </p>

          <h2>{trek.title}</h2>

          <div className={styles.bottom}>
            <div>
              <p className={styles.date}>
                {new Date(
                  trek.date
                ).toLocaleDateString()}
              </p>

              <h3>₹{trek.price}</h3>
            </div>

            <span className={styles.button}>
              View Trek →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}