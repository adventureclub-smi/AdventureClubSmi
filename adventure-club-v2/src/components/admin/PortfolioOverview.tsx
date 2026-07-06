"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Pencil } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./PortfolioOverview.module.scss";

type Trek = {
  id: string;
  title: string;
  distanceKm: number;
  altitudeMeters: number;
  campNights: number;
  countsAsPeak: boolean;
};

export default function PortfolioOverview() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/treks");
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

  const populatedCount = treks.filter(
    (t) => t.distanceKm > 0 || t.altitudeMeters > 0 || t.campNights > 0
  ).length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Portfolio Automation"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Portfolio" }]}
      />

      <p className={styles.subtitle}>
        <Sparkles size={14} /> {populatedCount} of {treks.length} treks have portfolio data —
        this feeds each student&apos;s Portfolio page (distance, altitude, camp nights, peak
        count).
      </p>

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : (
        <div className={styles.list}>
          {treks.map((trek) => {
            const populated =
              trek.distanceKm > 0 || trek.altitudeMeters > 0 || trek.campNights > 0;

            return (
              <div key={trek.id} className={styles.row}>
                <div>
                  <strong>{trek.title}</strong>
                  <div className={styles.meta}>
                    <span>{trek.distanceKm} km</span>
                    <span>{trek.altitudeMeters} m</span>
                    <span>{trek.campNights} nights</span>
                    <span>{trek.countsAsPeak ? "Counts as peak" : "Not a peak"}</span>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <StatusBadge
                    text={populated ? "Populated" : "Needs Data"}
                    tone={populated ? "success" : "waiting"}
                  />

                  <Link href={`/admin/edit-trek/${trek.id}`}>
                    <Pencil size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
