"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users } from "lucide-react";

import styles from "./StudentTreks.module.scss";

type Trek = {
  id: string;
  title: string;
  destination: string;
  difficulty: string;
  date: string;
  price: number;
  seats: number;
  coverImage?: string | null;
  status: string;
};

type SortOption = "date-asc" | "date-desc" | "price-asc" | "price-desc";

export default function StudentTreks() {
  const router = useRouter();
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("All");
  const [sort, setSort] = useState<SortOption>("date-asc");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/treks");
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

  const difficulties = useMemo(
    () => ["All", ...new Set(treks.map((t) => t.difficulty))],
    [treks]
  );

  const visible = useMemo(() => {
    let list = treks.filter((t) => t.status !== "Completed");

    if (difficulty !== "All") {
      list = list.filter((t) => t.difficulty === difficulty);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
  }, [treks, difficulty, sort]);

  function handleRegisterClick(trekId: string) {
    router.push(`/treks/${trekId}`);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Upcoming Treks</h1>
        <p>Find your next adventure and reserve your spot.</p>
      </div>

      <div className={styles.filters}>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
          <option value="date-asc">Date: Soonest First</option>
          <option value="date-desc">Date: Latest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading treks...</p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No treks match these filters.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((trek, i) => (
            <motion.div
              key={trek.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
            >
              <Link href={`/treks/${trek.id}`} className={styles.imageWrap}>
                <Image
                  src={trek.coverImage || "/images/default-trek.jpg"}
                  alt={trek.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 340px"
                  className={styles.image}
                />
                <div className={styles.overlay} />
                <span className={styles.difficulty}>{trek.difficulty}</span>
              </Link>

              <div className={styles.content}>
                <h2>{trek.title}</h2>

                <p>
                  <MapPin size={14} /> {trek.destination}
                </p>

                <p>
                  <CalendarDays size={14} />{" "}
                  {new Date(trek.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <p>
                  <Users size={14} /> {trek.seats} seats
                </p>

                <div className={styles.footer}>
                  <span className={styles.price}>₹{trek.price}</span>

                  <button
                    className={styles.registerButton}
                    onClick={() => handleRegisterClick(trek.id)}
                  >
                    View & Register
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
