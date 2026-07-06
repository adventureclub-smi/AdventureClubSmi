"use client";

import { useEffect, useState } from "react";
import TrendChart from "./shared/charts/TrendChart";
import DistributionChart from "./shared/charts/DistributionChart";
import styles from "./Analytics.module.scss";

type Point = { label: string; value: number };

type AnalyticsData = {
  registrationsOverTime: Point[];
  paymentsCollectedOverTime: Point[];
  certificatesIssuedOverTime: Point[];
  studentsByYear: Point[];
  studentsByCourse: Point[];
  treksCompleted: number;
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/analytics/overview");
        if (!res.ok || !active) return;
        setData(await res.json());
      } catch {
        // non-critical — charts simply stay empty
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (!data) return null;

  return (
    <section className={styles.section}>
      <h2>Analytics</h2>

      <div className={styles.grid}>
        <TrendChart
          title="Registrations"
          subtitle="Last 6 months"
          data={data.registrationsOverTime}
        />

        <TrendChart
          title="Payments Collected"
          subtitle="Last 6 months"
          data={data.paymentsCollectedOverTime}
          valuePrefix="₹"
        />

        <DistributionChart title="Students by Year" data={data.studentsByYear} />

        <DistributionChart title="Students by Course" data={data.studentsByCourse} />

        <TrendChart
          title="Certificates Issued"
          subtitle="Last 6 months"
          data={data.certificatesIssuedOverTime}
        />
      </div>
    </section>
  );
}
