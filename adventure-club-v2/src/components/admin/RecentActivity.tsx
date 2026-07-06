"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Wallet, Megaphone, Compass, Activity } from "lucide-react";

import styles from "./RecentActivity.module.scss";

type ActivityItem = {
  id: string;
  type: "registration" | "payment" | "announcement" | "trip_centre";
  title: string;
  message: string;
  timestamp: string;
  href: string;
};

const icons = {
  registration: UserPlus,
  payment: Wallet,
  announcement: Megaphone,
  trip_centre: Compass,
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/activity");
        if (!res.ok || !active) return;
        setItems(await res.json());
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
    <div className={styles.card}>
      <div className={styles.header}>
        <Activity size={18} />
        <h2>Recent Activity</h2>
      </div>

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : items.length === 0 ? (
        <p className={styles.hint}>No activity yet.</p>
      ) : (
        <div className={styles.timeline}>
          {items.map((item) => {
            const Icon = icons[item.type];

            return (
              <Link key={item.id} href={item.href} className={styles.item}>
                <span className={styles.icon}>
                  <Icon size={15} strokeWidth={1.75} />
                </span>

                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>{new Date(item.timestamp).toLocaleString()}</small>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
