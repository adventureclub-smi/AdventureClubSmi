"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, CalendarDays, ArrowRight, Compass } from "lucide-react";

import styles from "./ActiveTrekCard.module.scss";

type ActiveTrek = {
  id: string;
  title: string;
  destination: string;
  date: string;
  coverImage: string | null;
  registered: number;
  approved: number;
  initialPaid: number;
  bondForms: number;
  attendance: number;
};

export default function ActiveTrekCard() {
  const [trek, setTrek] = useState<ActiveTrek | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/active-trek");
        if (!res.ok || !active) return;
        setTrek(await res.json());
      } catch {
        // non-critical
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (trek === undefined) return null;

  if (!trek) {
    return (
      <div className={styles.empty}>
        <Compass size={22} />
        No upcoming trek yet.
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={trek.coverImage || "/images/default-trek.jpg"}
          alt={trek.title}
          fill
          sizes="(max-width: 1100px) 100vw, 320px"
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <small>Active Trek Spotlight</small>

        <h2>{trek.title}</h2>

        <p>
          <MapPin size={15} /> {trek.destination}
        </p>

        <p>
          <CalendarDays size={15} /> {new Date(trek.date).toLocaleDateString()}
        </p>

        <div className={styles.stats}>
          <div>
            <strong>{trek.registered}</strong>
            <span>Registered</span>
          </div>

          <div>
            <strong>{trek.approved}</strong>
            <span>Approved</span>
          </div>

          <div>
            <strong>{trek.initialPaid}</strong>
            <span>Initial Paid</span>
          </div>

          <div>
            <strong>{trek.bondForms}</strong>
            <span>Bond Forms</span>
          </div>

          <div>
            <strong>{trek.attendance}</strong>
            <span>Attendance</span>
          </div>
        </div>

        <Link href={`/admin/treks/${trek.id}`} className={styles.button}>
          Manage Trek <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
