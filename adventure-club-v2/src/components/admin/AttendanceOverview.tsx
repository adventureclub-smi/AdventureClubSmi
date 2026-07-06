"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./AttendanceOverview.module.scss";

type TrekOverview = {
  id: string;
  title: string;
  date: string;
  stages: {
    attendance: { count: number; total: number; pct: number };
  };
};

export default function AttendanceOverview() {
  const [treks, setTreks] = useState<TrekOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/operations-overview");
        if (!res.ok || !active) return;
        setTreks(await res.json());
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
      <PageHeader
        title="Attendance"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Attendance" }]}
      />

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : treks.length === 0 ? (
        <div className={styles.empty}>No active treks right now.</div>
      ) : (
        <div className={styles.grid}>
          {treks.map((trek) => (
            <Link
              key={trek.id}
              href={`/admin/treks/${trek.id}/attendance`}
              className={styles.card}
            >
              <div>
                <h3>{trek.title}</h3>
                <p>
                  <CalendarDays size={13} /> {new Date(trek.date).toLocaleDateString()}
                </p>

                <div className={styles.track}>
                  <div style={{ width: `${trek.stages.attendance.pct}%` }} />
                </div>

                <span>
                  {trek.stages.attendance.count}/{trek.stages.attendance.total} marked present
                </span>
              </div>

              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
