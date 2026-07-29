"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  PiggyBank,
  Printer,
} from "lucide-react";

import PieDistributionChart from "./shared/charts/PieDistributionChart";
import styles from "./TrekReport.module.scss";

type Point = { label: string; value: number };

type Report = {
  trek: { title: string };
  registrations: {
    total: number;
    byYear: Point[];
    byCourse: Point[];
    byStatus: Point[];
  };
  attendance: {
    seatedCount: number;
    attended: number;
    notAttended: number;
  };
  payments: {
    seatedCount: number;
    initialPaidCount: number;
    initialPendingCount: number;
    finalPaidCount: number;
    finalPendingCount: number;
    byMethod: Point[];
  };
  finance: {
    revenueCollected: number;
    initialCollected: number;
    finalCollected: number;
    totalIncome: number;
    totalExpenses: number;
    totalRefund: number;
    net: number;
    studentProfitLoss: number;
    collegeFundRemaining: number;
  };
};

export default function TrekReport({ trekId }: { trekId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/treks/${trekId}/report`);
        if (!res.ok || !active) return;
        setReport(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

  if (loading) return <p className={styles.hint}>Loading report...</p>;
  if (!report) return <p className={styles.hint}>Couldn&apos;t load this trek&apos;s report.</p>;

  const { registrations, attendance, payments, finance } = report;

  const attendanceRate =
    attendance.seatedCount > 0
      ? Math.round((attendance.attended / attendance.seatedCount) * 100)
      : 0;

  return (
    <div className={styles.container}>
      <div className={styles.reportHeader}>
        <h2>{report.trek.title} — Full Report</h2>

        <button
          type="button"
          className={styles.printButton}
          data-no-print
          onClick={() => window.print()}
        >
          <Printer size={15} />
          Print / Save as PDF
        </button>
      </div>

      <section className={styles.section}>
        <h3>Registrations</h3>

        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <Users size={18} />
            <div>
              <strong>{registrations.total}</strong>
              <span>Total Registrations</span>
            </div>
          </div>

          {registrations.byStatus.map((s) => (
            <div className={styles.summaryCard} key={s.label}>
              <Users size={18} />
              <div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chartGrid}>
          <PieDistributionChart title="Registrations by Year" data={registrations.byYear} />
          <PieDistributionChart title="Registrations by Course" data={registrations.byCourse} />
        </div>
      </section>

      <section className={styles.section}>
        <h3>Attendance</h3>

        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <Users size={18} />
            <div>
              <strong>{attendance.seatedCount}</strong>
              <span>Seated Participants</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <UserCheck size={18} />
            <div>
              <strong>{attendance.attended}</strong>
              <span>Attended · {attendanceRate}%</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.loss}`}>
            <UserX size={18} />
            <div>
              <strong>{attendance.notAttended}</strong>
              <span>Not Attended</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Payments</h3>

        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <IndianRupee size={18} />
            <div>
              <strong>{payments.initialPaidCount}</strong>
              <span>Initial Paid</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${payments.initialPendingCount > 0 ? styles.loss : ""}`}>
            <IndianRupee size={18} />
            <div>
              <strong>{payments.initialPendingCount}</strong>
              <span>Initial Pending</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <IndianRupee size={18} />
            <div>
              <strong>{payments.finalPaidCount}</strong>
              <span>Final Paid</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${payments.finalPendingCount > 0 ? styles.loss : ""}`}>
            <IndianRupee size={18} />
            <div>
              <strong>{payments.finalPendingCount}</strong>
              <span>Final Pending</span>
            </div>
          </div>
        </div>

        <div className={styles.chartGrid}>
          <PieDistributionChart title="Payments by Method" data={payments.byMethod} />
        </div>
      </section>

      <section className={styles.section}>
        <h3>Finance</h3>

        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <Wallet size={18} />
            <div>
              <strong>₹{finance.revenueCollected}</strong>
              <span>Revenue Collected</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <IndianRupee size={18} />
            <div>
              <strong>₹{finance.initialCollected}</strong>
              <span>Initial Collected</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <IndianRupee size={18} />
            <div>
              <strong>₹{finance.finalCollected}</strong>
              <span>Final Collected</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <TrendingUp size={18} />
            <div>
              <strong>₹{finance.totalIncome}</strong>
              <span>Other Income</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <TrendingDown size={18} />
            <div>
              <strong>₹{finance.totalExpenses}</strong>
              <span>Total Expenses</span>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${finance.studentProfitLoss < 0 ? styles.loss : ""}`}>
            {finance.studentProfitLoss < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            <div>
              <strong>₹{finance.studentProfitLoss}</strong>
              <span>Student Profit/Loss</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <Receipt size={18} />
            <div>
              <strong>₹{finance.totalRefund}</strong>
              <span>Total Refund</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <IndianRupee size={18} />
            <div>
              <strong>₹{finance.net}</strong>
              <span>Net</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <PiggyBank size={18} />
            <div>
              <strong>₹{finance.collegeFundRemaining}</strong>
              <span>College Fund Remaining</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
