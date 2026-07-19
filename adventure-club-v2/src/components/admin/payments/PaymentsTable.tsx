"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle, Lock, Clock, Unlock, FlagTriangleRight } from "lucide-react";
import styles from "./PaymentsTable.module.scss";
import PaymentDrawer from "./PaymentDrawer";
import type { PaymentRegistration } from "./types";

type Registration = PaymentRegistration;

interface Props {
  trekId: string;
}

export default function PaymentsTable({ trekId }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [unlockingAll, setUnlockingAll] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState("");
  const [completingTrek, setCompletingTrek] = useState(false);
  const [completeStatus, setCompleteStatus] = useState("");

  async function fetchPayments() {
    try {
      const res = await fetch(`/api/admin/payments/${trekId}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/payments/${trekId}`);
        const data = await res.json();
        if (active) setRegistrations(Array.isArray(data) ? data : []);
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

  async function toggleBondForm(registrationId: string, current: boolean) {
    try {
      await fetch(`/api/admin/bond-form/${registrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bondFormSubmitted: !current }),
      });

      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUnlockAll() {
    const confirmUnlock = confirm(
      "Unlock final payment for every participant who has completed their initial payment on this trek?"
    );

    if (!confirmUnlock) return;

    setUnlockingAll(true);
    setUnlockStatus("");

    try {
      const res = await fetch("/api/admin/payments/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId }),
      });

      const data = await res.json();

      setUnlockStatus(data.message || "Done.");
      fetchPayments();
    } finally {
      setUnlockingAll(false);
    }
  }

  const isSingleInstallment = registrations[0]?.trek?.installments === 1;
  const isHistorical = registrations[0]?.trek?.isHistorical ?? false;

  const trekCompleted = registrations.some(
    (r) => r.status === "COMPLETED" || r.status === "MISSED"
  );

  async function handleCompleteTrek() {
    const confirmComplete = confirm(
      trekCompleted
        ? "Undo trek completion? Every completed/missed participant on this trek reverts to Approved."
        : "Mark this trek as completed? Participants marked present will show as Trip Completed, everyone else as Trip Missed. You can undo this anytime."
    );

    if (!confirmComplete) return;

    setCompletingTrek(true);
    setCompleteStatus("");

    try {
      const res = await fetch("/api/admin/payments/complete-trek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId, undo: trekCompleted }),
      });

      const data = await res.json();

      setCompleteStatus(data.message || "Done.");
      fetchPayments();
    } finally {
      setCompletingTrek(false);
    }
  }

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const name = registration.user?.fullName ?? registration.guestName ?? "";
      const clubId = registration.user?.clubId ?? "";

      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        clubId.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [registrations, search]);

  const stats = useMemo(() => {
    const participants = registrations.length;
    const initialPaid = registrations.filter((r) => r.initialPaymentPaid).length;
    const finalPaid = registrations.filter((r) => r.finalPaymentPaid).length;
    const pending = registrations.filter((r) => !r.initialPaymentPaid).length;

    const collected = registrations.reduce(
      (sum, r) => sum + (r.initialPaymentPaid ? r.paymentAmount ?? 0 : 0),
      0
    );

    return { participants, initialPaid, finalPaid, pending, collected };
  }, [registrations]);

  if (loading) {
    return <div className={styles.loading}>Loading payments...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p>Manage all participant payments for this trek.</p>

        <div className={styles.searchWrap}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h2>{stats.participants}</h2>
          <span>Participants</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.initialPaid}</h2>
          <span>Initial Paid</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.finalPaid}</h2>
          <span>Final Paid</span>
        </div>

        <div className={styles.statCard}>
          <h2>₹{stats.collected}</h2>
          <span>Collected</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.pending}</h2>
          <span>Pending</span>
        </div>
      </div>

      {/* Both bulk actions key off "APPROVED" status and toggle the trek's
          live listing status — meaningless (and, for "Undo", actively
          harmful to already-COMPLETED/MISSED historical data) for an
          archived trek, so they're live-trek only. */}
      {!isHistorical && (
        <div className={styles.bulkActions}>
          {!isSingleInstallment && (
            <button
              className={styles.unlockAllButton}
              disabled={unlockingAll}
              onClick={handleUnlockAll}
            >
              <Unlock size={15} />
              {unlockingAll ? "Unlocking..." : "Unlock Final Payment for All"}
            </button>
          )}

          <button
            className={trekCompleted ? styles.undoCompleteButton : styles.completeTrekButton}
            disabled={completingTrek}
            onClick={handleCompleteTrek}
          >
            <FlagTriangleRight size={15} />
            {completingTrek
              ? "Working..."
              : trekCompleted
              ? "Undo Trek Completion"
              : "Mark Trek Completed"}
          </button>

          {unlockStatus && <p className={styles.unlockStatus}>{unlockStatus}</p>}
          {completeStatus && <p className={styles.unlockStatus}>{completeStatus}</p>}
        </div>
      )}

      <div className={styles.cards}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No participants found.</div>
        ) : (
          filtered.map((registration) => {
            const participant =
              registration.user?.fullName ?? registration.guestName ?? "Unknown Participant";
            const clubId = registration.user?.clubId ?? "-";

            return (
              <div key={registration.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{participant}</h3>
                    <p>{clubId}</p>
                  </div>

                  <button className={styles.manage} onClick={() => setSelected(registration)}>
                    View Details
                  </button>
                </div>

                <div className={styles.grid}>
                  <div className={styles.infoCard}>
                    <span>{isSingleInstallment ? "Full Payment" : "Initial Payment"}</span>

                    {registration.initialPaymentPaid ? (
                      <strong className={styles.success}>
                        <CheckCircle2 size={15} /> Paid
                      </strong>
                    ) : registration.initialPaymentDidNotPay ? (
                      <strong className={styles.danger}>
                        <XCircle size={15} /> Didn&apos;t Pay
                      </strong>
                    ) : (
                      <strong className={styles.danger}>
                        <XCircle size={15} /> Pending
                      </strong>
                    )}
                  </div>

                  {!isSingleInstallment && (
                    <div className={styles.infoCard}>
                      <span>Final Payment</span>

                      {registration.finalPaymentPaid ? (
                        <strong className={styles.success}>
                          <CheckCircle2 size={15} /> Paid
                        </strong>
                      ) : registration.finalPaymentDidNotPay ? (
                        <strong className={styles.danger}>
                          <XCircle size={15} /> Didn&apos;t Pay
                        </strong>
                      ) : registration.finalPaymentUnlocked ? (
                        <strong className={styles.warning}>
                          <Clock size={15} /> Unlocked
                        </strong>
                      ) : (
                        <strong className={styles.locked}>
                          <Lock size={15} /> Locked
                        </strong>
                      )}
                    </div>
                  )}

                  <div className={styles.infoCard}>
                    <span>Method</span>
                    <strong>{registration.paymentMethod ?? "Not Recorded"}</strong>
                  </div>

                  <div className={styles.infoCard}>
                    <span>Amount</span>
                    <strong>₹{registration.paymentAmount ?? 0}</strong>
                  </div>

                  <div className={styles.infoCard}>
                    <span>Bond Form</span>

                    {registration.bondFormSubmitted ? (
                      <strong className={styles.success}>
                        <CheckCircle2 size={15} /> Submitted
                      </strong>
                    ) : (
                      <strong className={styles.warning}>
                        <Clock size={15} /> Pending
                      </strong>
                    )}

                    <button
                      className={registration.bondFormSubmitted ? styles.undoBond : styles.bondButton}
                      onClick={() =>
                        toggleBondForm(registration.id, registration.bondFormSubmitted)
                      }
                    >
                      {registration.bondFormSubmitted ? "Undo" : "Mark Submitted"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <PaymentDrawer
          registration={selected}
          onClose={() => setSelected(null)}
          refresh={fetchPayments}
        />
      )}
    </div>
  );
}
