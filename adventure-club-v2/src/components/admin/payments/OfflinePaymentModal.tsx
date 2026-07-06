"use client";

import { useState } from "react";
import styles from "./OfflinePaymentModal.module.scss";

interface Props {
  registration: any;
  onClose: () => void;
  refresh: () => void;
}

export default function OfflinePaymentModal({
  registration,
  onClose,
  refresh,
}: Props) {
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState(
    registration.paymentAmount ??
      registration.trek?.initialPayment ??
      0
  );

  const [reference, setReference] =
    useState("");

  const [recordedBy, setRecordedBy] =
    useState("Admin");

  const [loading, setLoading] =
    useState(false);

  async function save() {
    setLoading(true);

    try {
      const res = await fetch(
        "/api/admin/payments/offline",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            registrationId:
              registration.id,

            method,

            amount,

            reference,

            recordedBy,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Payment recorded.");

      refresh();

      onClose();
    } catch (err) {
      console.error(err);

      alert("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <h2>
          Record Offline Payment
        </h2>

        <label>
          Payment Method
        </label>

        <select
          value={method}
          onChange={(e) =>
            setMethod(e.target.value)
          }
        >
          <option>Cash</option>

          <option>UPI</option>

          <option>
            Bank Transfer
          </option>
        </select>

        <label>
          Amount
        </label>

        <input
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(
              Number(e.target.value)
            )
          }
        />

        <label>
          Reference
        </label>

        <input
          value={reference}
          placeholder="Txn ID / Receipt"
          onChange={(e) =>
            setReference(
              e.target.value
            )
          }
        />

        <label>
          Recorded By
        </label>

        <input
          value={recordedBy}
          onChange={(e) =>
            setRecordedBy(
              e.target.value
            )
          }
        />

        <div className={styles.buttons}>

          <button
            className={styles.cancel}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={styles.save}
            disabled={loading}
            onClick={save}
          >
            {loading
              ? "Saving..."
              : "Record Payment"}
          </button>

        </div>

      </div>
    </div>
  );
}