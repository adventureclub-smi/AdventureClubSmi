"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, AlertTriangle } from "lucide-react";

import styles from "./AdminWelcome.module.scss";

export default function AdminWelcome() {
  const [attentionCount, setAttentionCount] = useState<number | null>(null);

  const hour = new Date().getHours();

  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok || !active) return;
        const data = await res.json();
        setAttentionCount(data.count ?? 0);
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
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <p className={styles.eyebrow}>{today}</p>

        <h1>
          {greeting}, <span>Admin</span>
        </h1>

        {attentionCount === null ? null : attentionCount === 0 ? (
          <p className={styles.status}>
            <CheckCircle2 size={16} />
            Everything is running smoothly.
          </p>
        ) : (
          <Link href="/admin" className={styles.statusAlert}>
            <AlertTriangle size={16} />
            Attention required — {attentionCount} item
            {attentionCount === 1 ? "" : "s"} need your review.
          </Link>
        )}
      </div>

      <Link href="/admin/create-trek" className={styles.button}>
        <Plus size={20} />
        <span>Create Trek</span>
      </Link>
    </motion.div>
  );
}
