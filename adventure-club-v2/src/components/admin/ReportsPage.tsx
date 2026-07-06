"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import Analytics from "@/components/admin/Analytics";
import styles from "./ReportsPage.module.scss";

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(
      headers
        .map((key) => {
          const value = row[key];
          const str = value === null || value === undefined ? "" : String(value);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
  }

  return lines.join("\n");
}

export default function ReportsPage() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);

    try {
      const res = await fetch("/api/admin/reports/registrations-csv");
      if (!res.ok) return;

      const rows = await res.json();
      const csv = toCsv(rows);

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();

      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Reports"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
        quickActions={
          <button className={styles.exportButton} onClick={handleExport} disabled={exporting}>
            <Download size={15} />
            {exporting ? "Exporting..." : "Export Registrations (CSV)"}
          </button>
        }
      />

      <Analytics />
    </div>
  );
}
