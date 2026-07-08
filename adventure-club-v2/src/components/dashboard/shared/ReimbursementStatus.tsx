"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "./ReimbursementStatus.module.scss";

export default function ReimbursementStatus({
  registrationId,
  reimbursementAmount,
  reimbursementDone,
  reimbursementReceived,
  expectedMin,
  expectedMax,
}: {
  registrationId: string;
  reimbursementAmount: number | null;
  reimbursementDone: boolean;
  reimbursementReceived: boolean;
  expectedMin: number | null;
  expectedMax: number | null;
}) {
  const [received, setReceived] = useState(reimbursementReceived);
  const [marking, setMarking] = useState(false);

  async function handleMarkReceived() {
    setMarking(true);

    try {
      const res = await fetch(`/api/student/reimbursement/${registrationId}/received`, {
        method: "POST",
      });

      if (res.ok) setReceived(true);
    } finally {
      setMarking(false);
    }
  }

  if (!reimbursementDone) {
    return (
      <div className={styles.pending}>
        Reimbursement Pending
        {(expectedMin != null || expectedMax != null) && (
          <span>
            {" "}
            · Expected ₹{expectedMin ?? "?"}–{expectedMax ?? "?"}
          </span>
        )}
      </div>
    );
  }

  if (received) {
    return (
      <div className={styles.received}>
        <CheckCircle2 size={14} /> Reimbursement Received — ₹{reimbursementAmount ?? 0}
      </div>
    );
  }

  return (
    <div className={styles.done}>
      <p>Reimbursement Done — ₹{reimbursementAmount ?? 0}</p>
      <p className={styles.note}>Please check and click below once you&apos;ve received it.</p>
      <button
        type="button"
        className={styles.receivedButton}
        disabled={marking}
        onClick={handleMarkReceived}
      >
        {marking ? "Marking..." : "Received"}
      </button>
    </div>
  );
}
