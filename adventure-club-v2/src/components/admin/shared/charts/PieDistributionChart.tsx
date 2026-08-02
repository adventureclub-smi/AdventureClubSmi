"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

import styles from "./charts.module.scss";

type Point = { label: string; value: number };

// Accent green first (the brand color, so the largest/first slice reads as
// "the club's color"), then a spread of hues distinct enough to tell apart
// across 6+ slices on a dark background.
const COLORS = [
  "#00a073",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

export default function PieDistributionChart({
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
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.label} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1b1b1b",
                  border: "1px solid rgba(245, 245, 245,0.1)",
                  borderRadius: 10,
                  color: "#f5f5f5",
                  fontSize: 13,
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty}>No data yet.</div>
      )}
    </div>
  );
}
