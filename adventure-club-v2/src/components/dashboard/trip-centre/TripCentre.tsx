"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, CalendarDays, Compass } from "lucide-react";

import BackButton from "@/components/dashboard/shared/BackButton";
import styles from "./TripCentre.module.scss";

interface Trek {
  id: string;
  title: string;
  destination: string;
  date: string;
  coverImage?: string;
}

export default function TripCentre() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/trip-centre");
        const data = await res.json();
        if (active) setTreks(data);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>Trip Centre</h1>
      <p className={styles.subtitle}>All your confirmed upcoming adventures.</p>

      {loading ? (
        <p className={styles.subtitle}>Loading...</p>
      ) : treks.length === 0 ? (
        <div className={styles.empty}>No active trips available.</div>
      ) : (
        <div className={styles.grid}>
          {treks.map((trek, i) => (
            <motion.div
              key={trek.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={trek.coverImage || "/images/default-trek.jpg"}
                  alt={trek.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 360px"
                  className={styles.image}
                />
              </div>

              <div className={styles.content}>
                <h2>{trek.title}</h2>

                <p>
                  <MapPin size={14} strokeWidth={1.75} /> {trek.destination}
                </p>

                <p>
                  <CalendarDays size={14} strokeWidth={1.75} />{" "}
                  {new Date(trek.date).toLocaleDateString()}
                </p>

                <Link href={`/dashboard/trip-centre/${trek.id}`} className={styles.button}>
                  <Compass size={16} strokeWidth={1.75} /> Open Trip Centre
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
