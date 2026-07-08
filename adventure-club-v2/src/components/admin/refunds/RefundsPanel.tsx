"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  PiggyBank,
  Receipt,
  TrendingUp,
  Save,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import styles from "./RefundsPanel.module.scss";
import type { RefundRegistration, RefundTrekSettings } from "./types";

function participantName(registration: RefundRegistration) {
  return registration.user?.fullName ?? registration.guestName ?? "Unknown Participant";
}

function sumAmounts(group: RefundRegistration[], amounts: Record<string, string>) {
  return group.reduce((sum, r) => sum + (parseInt(amounts[r.id], 10) || 0), 0);
}

export default function RefundsPanel({ trekId }: { trekId: string }) {
  const [registrations, setRegistrations] = useState<RefundRegistration[]>([]);
  const [trek, setTrek] = useState<RefundTrekSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [finalBulk, setFinalBulk] = useState("");
  const [initialBulk, setInitialBulk] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [expectedMin, setExpectedMin] = useState("");
  const [expectedMax, setExpectedMax] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/refunds/${trekId}`);
        const data: { trek: RefundTrekSettings; registrations: RefundRegistration[] } =
          await res.json();

        if (!active || !data?.registrations) return;

        setRegistrations(data.registrations);
        setTrek(data.trek);
        setExpectedMin(data.trek.expectedReimbursementMin?.toString() ?? "");
        setExpectedMax(data.trek.expectedReimbursementMax?.toString() ?? "");
        setAmounts(
          Object.fromEntries(
            data.registrations.map((r) => [
              r.id,
              r.reimbursementAmount != null ? String(r.reimbursementAmount) : "",
            ])
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

  const doneCount = registrations.filter((r) => r.reimbursementDone).length;
  const receivedCount = registrations.filter((r) => r.reimbursementReceived).length;

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

  async function handleSaveRange() {
    setSavingSettings(true);
    setSettingsStatus("");

    try {
      const res = await fetch(`/api/admin/refunds/${trekId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedReimbursementMin: expectedMin ? parseInt(expectedMin, 10) : null,
          expectedReimbursementMax: expectedMax ? parseInt(expectedMax, 10) : null,
        }),
      });

      const data = await res.json();
      setTrek(data);
      setSettingsStatus("Expected range saved.");
    } catch (error) {
      console.error(error);
      setSettingsStatus("Failed to save range.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleToggleRowDone(registration: RefundRegistration) {
    const nextDone = !registration.reimbursementDone;
    const amount = amounts[registration.id] ? parseInt(amounts[registration.id], 10) : null;

    setRowSavingId(registration.id);

    try {
      const res = await fetch(`/api/admin/refunds/${trekId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ registrationId: registration.id, amount, done: nextDone }],
        }),
      });

      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registration.id
              ? { ...r, reimbursementAmount: amount, reimbursementDone: nextDone }
              : r
          )
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRowSavingId(null);
    }
  }

  function renderRow(r: RefundRegistration) {
    return (
      <div key={r.id} className={styles.row}>
        <div className={styles.rowInfo}>
          <strong>{participantName(r)}</strong>
          <span>{r.user?.upiId ?? "No UPI ID"}</span>
          <span>{r.user?.upiPhone ?? "No UPI number"}</span>
        </div>

        <div className={styles.rowRight}>
          {r.reimbursementReceived ? (
            <span className={styles.receivedBadge}>
              <CheckCircle2 size={13} /> Received
            </span>
          ) : r.reimbursementDone ? (
            <span className={styles.doneBadge}>
              <CheckCircle2 size={13} /> Done
            </span>
          ) : null}

          <div className={styles.rowAmount}>
            <span>₹</span>
            <input
              type="number"
              value={amounts[r.id] ?? ""}
              onChange={(e) => handleRowChange(r.id, e.target.value)}
            />
          </div>

          <button
            className={r.reimbursementDone ? styles.undoRowButton : styles.doneRowButton}
            disabled={rowSavingId === r.id}
            onClick={() => handleToggleRowDone(r)}
          >
            {r.reimbursementDone ? <Undo2 size={13} /> : <CheckCircle2 size={13} />}
            {rowSavingId === r.id ? "Saving..." : r.reimbursementDone ? "Undo" : "Mark Done"}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !trek) {
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
          <h3>Expected Reimbursement Range</h3>

          <span className={styles.receivedCount}>
            {doneCount} done · {receivedCount} received (of {registrations.length})
          </span>
        </div>

        <div className={styles.rangeRow}>
          <label className={styles.rangeInput}>
            Expected Min
            <input
              type="number"
              placeholder="₹"
              value={expectedMin}
              onChange={(e) => setExpectedMin(e.target.value)}
            />
          </label>

          <label className={styles.rangeInput}>
            Expected Max
            <input
              type="number"
              placeholder="₹"
              value={expectedMax}
              onChange={(e) => setExpectedMax(e.target.value)}
            />
          </label>

          <button
            className={styles.rangeSaveButton}
            disabled={savingSettings}
            onClick={handleSaveRange}
          >
            Save Range
          </button>
        </div>

        {settingsStatus && <p className={styles.saveStatus}>{settingsStatus}</p>}
      </section>

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
          <div className={styles.rows}>{finalGroup.map(renderRow)}</div>
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
          <div className={styles.rows}>{initialGroup.map(renderRow)}</div>
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
