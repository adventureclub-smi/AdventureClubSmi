"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Wallet, CheckSquare, Compass } from "lucide-react";

import styles from "./OperationsOverview.module.scss";

type Stage = { count: number; total: number; pct: number };

type TrekOverview = {
  id: string;
  title: string;
  date: string;
  tripCentrePublished: boolean;
  stages: {
    registration: Stage;
    payment: Stage;
    bondForm: Stage;
    tripCentre: Stage;
    attendance: Stage;
    finalPayment: Stage;
    completion: Stage;
    certificates: Stage;
  };
};

const stageLabels: { key: keyof TrekOverview["stages"]; label: string }[] = [
  { key: "registration", label: "Registration" },
  { key: "payment", label: "Initial Payment" },
  { key: "bondForm", label: "Bond Forms" },
  { key: "tripCentre", label: "Trip Centre" },
  { key: "attendance", label: "Attendance" },
  { key: "finalPayment", label: "Final Payment" },
  { key: "completion", label: "Completion" },
  { key: "certificates", label: "Certificates" },
];

export default function OperationsOverview() {
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

  if (loading) return null;

  return (
    <section className={styles.section}>
      <h2>Operations Overview</h2>

      {treks.length === 0 ? (
        <div className={styles.empty}>No active treks right now.</div>
      ) : (
        <div className={styles.grid}>
          {treks.map((trek) => (
            <div key={trek.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>{trek.title}</h3>
                  <p>
                    <CalendarDays size={13} />
                    {new Date(trek.date).toLocaleDateString()}
                  </p>
                </div>

                <Link href={`/admin/treks/${trek.id}`} className={styles.manage}>
                  Manage
                </Link>
              </div>

              <div className={styles.stages}>
                {stageLabels.map(({ key, label }) => {
                  const stage = trek.stages[key];

                  return (
                    <div key={key} className={styles.stage}>
                      <div className={styles.stageLabel}>
                        <span>{label}</span>
                        <span>
                          {stage.count}/{stage.total}
                        </span>
                      </div>

                      <div className={styles.track}>
                        <div style={{ width: `${stage.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <Link href={`/admin/treks/${trek.id}/registrations`}>
                  <ClipboardList size={14} /> Registrations
                </Link>

                <Link href={`/admin/treks/${trek.id}/payments`}>
                  <Wallet size={14} /> Payments
                </Link>

                <Link href={`/admin/treks/${trek.id}/attendance`}>
                  <CheckSquare size={14} /> Attendance
                </Link>

                <Link href={`/admin/treks/${trek.id}/trip-centre`}>
                  <Compass size={14} /> Trip Centre
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
