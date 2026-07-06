"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Wallet, ArrowRight } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./PaymentsOverview.module.scss";

type PendingItem = {
  id: string;
  participant: string;
  trekId: string;
  trekTitle: string;
  amount: number;
  method: string;
  createdAt: string;
};

type TrekSummary = {
  id: string;
  title: string;
  total: number;
  collected: number;
  pending: number;
};

export default function PaymentsOverview() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [treks, setTreks] = useState<TrekSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/payments-overview");
        if (!res.ok || !active) return;
        const data = await res.json();
        setPending(data.pendingVerification);
        setTreks(data.treks);
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
    <div className={styles.container}>
      <PageHeader
        title="Payments"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Payments" }]}
      />

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : (
        <>
          <section className={styles.section}>
            <h2>
              <Clock size={18} /> Pending Verification ({pending.length})
            </h2>

            {pending.length === 0 ? (
              <div className={styles.empty}>No payments awaiting verification.</div>
            ) : (
              <div className={styles.list}>
                {pending.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/treks/${item.trekId}/payments`}
                    className={styles.row}
                  >
                    <div>
                      <strong>{item.participant}</strong>
                      <p>{item.trekTitle}</p>
                    </div>

                    <div className={styles.rowRight}>
                      <span>₹{item.amount}</span>
                      <small>{item.method}</small>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>
              <Wallet size={18} /> Payments by Trek
            </h2>

            <div className={styles.grid}>
              {treks.map((trek) => (
                <Link
                  key={trek.id}
                  href={`/admin/treks/${trek.id}/payments`}
                  className={styles.trekCard}
                >
                  <div>
                    <h3>{trek.title}</h3>
                    <p>
                      {trek.collected}/{trek.total} paid • {trek.pending} pending
                    </p>
                  </div>

                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
