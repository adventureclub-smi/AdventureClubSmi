"use client";

import { useEffect, useState } from "react";
import StatusBadge, { type StatusTone } from "@/components/dashboard/shared/StatusBadge";
import styles from "./RecentRegistrations.module.scss";

type Registration = {
  id: string;
  status: string;
  guestName?: string | null;
  user?: { fullName: string } | null;
  trek: { title: string };
};

const toneByStatus: Record<string, StatusTone> = {
  WAITING: "waiting",
  APPROVED: "approved",
  WAITLIST: "waitlist",
  REJECTED: "rejected",
  COMPLETED: "completed",
  MISSED: "danger",
};

export default function RecentRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/recent-registrations");
        if (!res.ok || !active) return;
        setRegistrations(await res.json());
      } catch {
        // non-critical
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Recent Registrations</h2>
      </div>

      {registrations.length === 0 ? (
        <p className={styles.empty}>No registrations yet.</p>
      ) : (
        registrations.map((registration) => (
          <div key={registration.id} className={styles.row}>
            <div>
              <strong>{registration.user?.fullName || registration.guestName}</strong>
              <p>{registration.trek.title}</p>
            </div>

            <StatusBadge
              text={registration.status}
              tone={toneByStatus[registration.status] || "neutral"}
            />
          </div>
        ))
      )}
    </div>
  );
}
