"use client";

import { useEffect, useState } from "react";
import styles from "./PaymentsTab.module.scss";

export default function PaymentsTab({
  trekId,
}: {
  trekId: string;
}) {
  const [registrations, setRegistrations] =
    useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch(
      `/api/admin/payments/${trekId}`
    );

    setRegistrations(await res.json());
  }

  async function verify(
    registrationId: string
  ) {
    await fetch(
      "/api/admin/payments/verify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          registrationId,
        }),
      }
    );

    load();
  }

  async function unlock(
    id: string,
    value: boolean
  ) {
    await fetch(
      "/api/admin/payments/unlock",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          registrationId: id,
          unlock: value,
        }),
      }
    );

    load();
  }

  const initialPaid =
    registrations.filter(
      (r) => r.initialPaymentPaid
    ).length;

  const finalPaid =
    registrations.filter(
      (r) => r.finalPaymentPaid
    ).length;

  const unlocked =
    registrations.filter(
      (r) => r.finalPaymentUnlocked
    ).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Payments</h2>
      </div>

      <div className={styles.stats}>
        <div className={styles.card}>
          <h1>{registrations.length}</h1>
          <p>Total Submitted</p>
        </div>

        <div className={styles.card}>
          <h1>{initialPaid}</h1>
          <p>Initial Paid</p>
        </div>

        <div className={styles.card}>
          <h1>{unlocked}</h1>
          <p>Final Payment Unlocked</p>
        </div>

        <div className={styles.card}>
          <h1>{finalPaid}</h1>
          <p>Final Paid</p>
        </div>
      </div>

      <div className={styles.list}>
        {registrations.length === 0 && (
          <p>No payment submissions yet.</p>
        )}

        {registrations.map((r) => (
          <div
            key={r.id}
            className={styles.row}
          >
            <div className={styles.user}>
              <h3>{r.user.fullName}</h3>

              <p>{r.user.clubId}</p>

              <br />

              {r.payments.length === 0 ? (
                <p>No payment found</p>
              ) : (
                r.payments.map(
                  (payment: any) => (
                    <div
                      key={payment.id}
                      style={{
                        marginBottom: 12,
                      }}
                    >
                      <strong>
                        {payment.type}
                      </strong>

                      <br />

                      Amount :
                      ₹{payment.amount}

                      <br />

                      UTR :
                      {payment.reference ||
                        "N/A"}

                      <br />

                      Status :
                      {payment.status}

                      {payment.notes && (
                        <>
                          <br />
                          Screenshot :
                          {payment.notes}
                        </>
                      )}
                    </div>
                  )
                )
              )}
            </div>

            <div className={styles.actions}>
              {!r.initialPaymentPaid && (
                <button
                  onClick={() =>
                    verify(r.id)
                  }
                >
                  Verify Initial Payment
                </button>
              )}

              <button
                onClick={() =>
                  unlock(
                    r.id,
                    !r.finalPaymentUnlocked
                  )
                }
              >
                {r.finalPaymentUnlocked
                  ? "Lock Final Payment"
                  : "Unlock Final Payment"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}