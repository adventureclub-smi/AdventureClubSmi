"use client";

import { useState } from "react";
import styles from "./PaymentDrawer.module.scss";
import type { PaymentRegistration } from "./types";

interface Props {
  registration: PaymentRegistration;
  onClose: () => void;
  refresh: () => void;
}

export default function PaymentDrawer({ registration, onClose, refresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [resubmitting, setResubmitting] = useState<"INITIAL" | "FINAL" | null>(null);
  const [markingNotPaid, setMarkingNotPaid] = useState<"INITIAL" | "FINAL" | null>(null);

  const initialPayment = registration.payments?.find((p) => p.type === "INITIAL");
  const finalPayment = registration.payments?.find((p) => p.type === "FINAL");
  const isSingleInstallment = registration.trek?.installments === 1;

  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(registration.paymentAmount || 0);
  const [recordedBy, setRecordedBy] = useState("Admin");

  async function recordOfflinePayment() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/payments/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          method,
          reference,
          amount,
          recordedBy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Offline payment recorded.");

      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }

    setLoading(false);
  }

  async function verifyInitial() {
    await fetch("/api/admin/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: registration.id,
        verified: !registration.initialPaymentPaid,
      }),
    });

    refresh();
    onClose();
  }

  async function verifyFinal() {
    await fetch("/api/admin/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: registration.id,
        verified: !registration.finalPaymentPaid,
        type: "FINAL",
      }),
    });

    refresh();
    onClose();
  }

  async function toggleDidNotPay(type: "INITIAL" | "FINAL", notPaid: boolean) {
    setMarkingNotPaid(type);

    try {
      await fetch("/api/admin/payments/mark-not-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id, type, notPaid }),
      });

      refresh();
      onClose();
    } finally {
      setMarkingNotPaid(null);
    }
  }

  async function requireResubmission(type: "INITIAL" | "FINAL") {
    const confirmReset = confirm(
      `This will reopen ${type === "FINAL" ? "final" : "initial"} payment for this student and they'll need to resubmit. Continue?`
    );

    if (!confirmReset) return;

    setResubmitting(type);

    try {
      await fetch("/api/admin/payments/require-resubmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id, type }),
      });

      refresh();
      onClose();
    } finally {
      setResubmitting(null);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        <h2>{registration.user?.fullName ?? registration.guestName}</h2>

        <p>{registration.user?.clubId}</p>

        {/* Participant */}

        <div className={styles.card}>
          <h3>Participant Details</h3>

          <div className={styles.item}>
            <span>Name</span>
            <strong>{registration.user?.fullName ?? registration.guestName}</strong>
          </div>

          <div className={styles.item}>
            <span>Club ID</span>
            <strong>{registration.user?.clubId || "-"}</strong>
          </div>

          <div className={styles.item}>
            <span>Email</span>
            <strong>{registration.user?.email || "-"}</strong>
          </div>

          <div className={styles.item}>
            <span>Status</span>
            <strong>{registration.status}</strong>
          </div>
        </div>

        {/* Reimbursement Details */}

        <div className={styles.card}>
          <h3>Reimbursement Details</h3>

          <div className={styles.item}>
            <span>UPI ID</span>
            <strong>{registration.user?.upiId || "-"}</strong>
          </div>

          <div className={styles.item}>
            <span>UPI Phone</span>
            <strong>{registration.user?.upiPhone || "-"}</strong>
          </div>

          <small className={styles.note}>
            Latest profile details entered by the student. These will be used for
            reimbursement.
          </small>
        </div>

        {/* Initial Payment */}

        <div className={styles.card}>
          <h3>{isSingleInstallment ? "Full Payment" : "Initial Payment"}</h3>

          <div className={styles.item}>
            <span>Status</span>

            <strong>
              {registration.initialPaymentPaid
                ? "🟢 Verified"
                : registration.initialPaymentDidNotPay
                ? "⚫ Didn't Pay"
                : registration.offlinePaymentCreated
                ? "🟡 Waiting Verification"
                : "🔴 Pending"}
            </strong>
          </div>

          <div className={styles.item}>
            <span>Recorded Amount</span>
            <strong>₹{registration.paymentAmount ?? initialPayment?.amount ?? 0}</strong>
          </div>

          <div className={styles.item}>
            <span>UTR / Reference</span>
            <strong>{initialPayment?.reference || "-"}</strong>
          </div>

          <div className={styles.screenshotSection}>
            <span>Payment Screenshot</span>

            {initialPayment?.notes ? (
              <a
                href={initialPayment.notes}
                target="_blank"
                rel="noreferrer"
                className={styles.imageLink}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialPayment.notes}
                  alt="Initial payment screenshot"
                  className={styles.paymentImage}
                />
                <p>Click to enlarge</p>
              </a>
            ) : (
              <div className={styles.noImage}>No Screenshot Uploaded</div>
            )}
          </div>

          <button className={styles.action} onClick={verifyInitial}>
            {registration.initialPaymentPaid
              ? "Undo Verification"
              : isSingleInstallment
              ? "Verify Payment"
              : "Verify Initial Payment"}
          </button>

          <button
            className={styles.didNotPayAction}
            disabled={markingNotPaid === "INITIAL"}
            onClick={() => toggleDidNotPay("INITIAL", !registration.initialPaymentDidNotPay)}
          >
            {markingNotPaid === "INITIAL"
              ? "Working..."
              : registration.initialPaymentDidNotPay
              ? "Undo Didn't Pay"
              : "Didn't Pay"}
          </button>

          <button
            className={styles.secondaryAction}
            disabled={resubmitting === "INITIAL"}
            onClick={() => requireResubmission("INITIAL")}
          >
            {resubmitting === "INITIAL" ? "Requesting..." : "Require Resubmission"}
          </button>
        </div>

        {/* Final Payment — not applicable to single-installment treks, whose
            one payment (above) already covers the whole trek cost. */}

        {!isSingleInstallment && (
          <div className={styles.card}>
            <h3>Final Payment</h3>

            <div className={styles.item}>
              <span>Status</span>

              <strong>
                {registration.finalPaymentPaid
                  ? "🟢 Paid"
                  : registration.finalPaymentDidNotPay
                  ? "⚫ Didn't Pay"
                  : registration.finalPaymentUnlocked
                  ? "🟡 Unlocked"
                  : "🔒 Locked"}
              </strong>
            </div>

            <div className={styles.item}>
              <span>Recorded Amount</span>
              <strong>₹{finalPayment?.amount ?? 0}</strong>
            </div>

            <div className={styles.item}>
              <span>UTR / Reference</span>
              <strong>{finalPayment?.reference || "-"}</strong>
            </div>

            <div className={styles.screenshotSection}>
              <span>Payment Screenshot</span>

              {finalPayment?.notes ? (
                <a
                  href={finalPayment.notes}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.imageLink}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finalPayment.notes}
                    alt="Final payment screenshot"
                    className={styles.paymentImage}
                  />
                  <p>Click to enlarge</p>
                </a>
              ) : (
                <div className={styles.noImage}>No Screenshot Uploaded</div>
              )}
            </div>

            <button className={styles.action} onClick={verifyFinal}>
              {registration.finalPaymentPaid ? "Undo Verification" : "Verify Final Payment"}
            </button>

            <button
              className={styles.didNotPayAction}
              disabled={markingNotPaid === "FINAL"}
              onClick={() => toggleDidNotPay("FINAL", !registration.finalPaymentDidNotPay)}
            >
              {markingNotPaid === "FINAL"
                ? "Working..."
                : registration.finalPaymentDidNotPay
                ? "Undo Didn't Pay"
                : "Didn't Pay"}
            </button>

            <button
              className={styles.secondaryAction}
              disabled={resubmitting === "FINAL"}
              onClick={() => requireResubmission("FINAL")}
            >
              {resubmitting === "FINAL" ? "Requesting..." : "Require Resubmission"}
            </button>
          </div>
        )}

        {/* Record Offline Payment */}

        <div className={styles.card}>
          <h3>Record Offline Payment</h3>

          <select value={method} onChange={(e) => setMethod(e.target.value)} className={styles.input}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
          </select>

          <input
            className={styles.input}
            placeholder="Reference Number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <input
            className={styles.input}
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <input
            className={styles.input}
            placeholder="Recorded By"
            value={recordedBy}
            onChange={(e) => setRecordedBy(e.target.value)}
          />

          <button className={styles.action} disabled={loading} onClick={recordOfflinePayment}>
            Record Offline Payment
          </button>
        </div>

        {/* Timeline */}

        <div className={styles.card}>
          <h3>Timeline</h3>

          <p>✅ Registration Approved</p>

          {registration.paymentPortal && <p>✅ Added to Payment Portal</p>}
          {registration.offlinePaymentCreated && <p>✅ Payment Submitted</p>}
          {registration.initialPaymentPaid && <p>✅ Payment Verified</p>}
          {!isSingleInstallment && registration.finalPaymentUnlocked && (
            <p>✅ Final Payment Unlocked</p>
          )}
          {!isSingleInstallment && registration.finalPaymentPaid && (
            <p>✅ Final Payment Paid</p>
          )}
        </div>
      </div>
    </div>
  );
}
