"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, PiggyBank, Receipt, TrendingUp, Save } from "lucide-react";
import styles from "./RefundsPanel.module.scss";
import type { RefundRegistration } from "./types";

function participantName(registration: RefundRegistration) {
  return registration.user?.fullName ?? registration.guestName ?? "Unknown Participant";
}

function sumAmounts(group: RefundRegistration[], amounts: Record<string, string>) {
  return group.reduce((sum, r) => sum + (parseInt(amounts[r.id], 10) || 0), 0);
}

export default function RefundsPanel({ trekId }: { trekId: string }) {
  const [registrations, setRegistrations] = useState<RefundRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [finalBulk, setFinalBulk] = useState("");
  const [initialBulk, setInitialBulk] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/refunds/${trekId}`);
        const data: RefundRegistration[] = await res.json();

        if (!active || !Array.isArray(data)) return;

        setRegistrations(data);
        setAmounts(
          Object.fromEntries(
            data.map((r) => [r.id, r.reimbursementAmount != null ? String(r.reimbursementAmount) : ""])
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

  const finalGroup = useMemo(
    () => registrations.filter((r) => r.finalPaymentPaid),
    [registrations]
  );

  const initialGroup = useMemo(
    () => registrations.filter((r) => r.initialPaymentPaid && !r.finalPaymentPaid),
    [registrations]
  );

  const finalTotal = useMemo(() => sumAmounts(finalGroup, amounts), [finalGroup, amounts]);
  const initialTotal = useMemo(() => sumAmounts(initialGroup, amounts), [initialGroup, amounts]);
  const grandTotal = finalTotal + initialTotal;
  const profit = grandTotal - finalTotal;

  function applyBulk(group: RefundRegistration[], value: string) {
    setAmounts((prev) => {
      const next = { ...prev };
      group.forEach((r) => {
        next[r.id] = value;
      });
      return next;
    });
  }

  function handleFinalBulkChange(value: string) {
    setFinalBulk(value);
    applyBulk(finalGroup, value);
  }

  function handleInitialBulkChange(value: string) {
    setInitialBulk(value);
    applyBulk(initialGroup, value);
  }

  function handleRowChange(id: string, value: string) {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("");

    try {
      const updates = [...finalGroup, ...initialGroup].map((r) => ({
        registrationId: r.id,
        amount: amounts[r.id] ? parseInt(amounts[r.id], 10) : null,
      }));

      const res = await fetch(`/api/admin/refunds/${trekId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      setSaveStatus(data.message || "Done.");
    } catch (error) {
      console.error(error);
      setSaveStatus("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading reimbursement data...</div>;
  }

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Track college reimbursement for this trek — split by who completed the
        final payment versus who only paid the initial payment.
      </p>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <Wallet size={18} />
          <h2>₹{finalTotal}</h2>
          <span>Final Payment Total</span>
        </div>

        <div className={styles.statCard}>
          <PiggyBank size={18} />
          <h2>₹{initialTotal}</h2>
          <span>Initial Only Total</span>
        </div>

        <div className={styles.statCard}>
          <Receipt size={18} />
          <h2>₹{grandTotal}</h2>
          <span>Grand Total</span>
        </div>

        <div className={`${styles.statCard} ${styles.profit}`}>
          <TrendingUp size={18} />
          <h2>₹{profit}</h2>
          <span>Profit</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Final Payment Paid</h3>

          <label className={styles.bulkInput}>
            Set amount for all
            <input
              type="number"
              placeholder="₹"
              value={finalBulk}
              onChange={(e) => handleFinalBulkChange(e.target.value)}
            />
          </label>
        </div>

        {finalGroup.length === 0 ? (
          <div className={styles.empty}>No one has completed the final payment yet.</div>
        ) : (
          <div className={styles.rows}>
            {finalGroup.map((r) => (
              <div key={r.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <strong>{participantName(r)}</strong>
                  <span>{r.user?.upiId ?? "No UPI ID"}</span>
                  <span>{r.user?.upiPhone ?? "No UPI number"}</span>
                </div>

                <div className={styles.rowAmount}>
                  <span>₹</span>
                  <input
                    type="number"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => handleRowChange(r.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Initial Payment Only</h3>

          <label className={styles.bulkInput}>
            Set amount for all
            <input
              type="number"
              placeholder="₹"
              value={initialBulk}
              onChange={(e) => handleInitialBulkChange(e.target.value)}
            />
          </label>
        </div>

        {initialGroup.length === 0 ? (
          <div className={styles.empty}>No one is in this group yet.</div>
        ) : (
          <div className={styles.rows}>
            {initialGroup.map((r) => (
              <div key={r.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <strong>{participantName(r)}</strong>
                  <span>{r.user?.upiId ?? "No UPI ID"}</span>
                  <span>{r.user?.upiPhone ?? "No UPI number"}</span>
                </div>

                <div className={styles.rowAmount}>
                  <span>₹</span>
                  <input
                    type="number"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => handleRowChange(r.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className={styles.footer}>
        <button className={styles.saveButton} disabled={saving} onClick={handleSave}>
          <Save size={15} />
          {saving ? "Saving..." : "Save Reimbursement Amounts"}
        </button>

        {saveStatus && <p className={styles.saveStatus}>{saveStatus}</p>}
      </div>
    </div>
  );
}
