"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import styles from "./charts.module.scss";

type Point = { label: string; value: number };

export default function TrendChart({
  title,
  subtitle,
  data,
  valuePrefix = "",
}: {
  title: string;
  subtitle?: string;
  data: Point[];
  valuePrefix?: string;
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
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                formatter={(value) => [`${valuePrefix}${value}`, ""]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty}>No data yet for this period.</div>
      )}
    </div>
  );
}
