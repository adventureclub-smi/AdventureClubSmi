"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import styles from "./charts.module.scss";

type Point = { label: string; value: number };

export default function DistributionChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: Point[];
}) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {hasData ? (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(245,245,245,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#1b1b1b",
                  border: "1px solid rgba(245,245,245,0.1)",
                  borderRadius: 10,
                  color: "#f5f5f5",
                  fontSize: 13,
                }}
                labelStyle={{ color: "#9ca3af" }}
                cursor={{ fill: "rgba(245,245,245,0.04)" }}
              />
              <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty}>No data yet.</div>
      )}
    </div>
  );
}
