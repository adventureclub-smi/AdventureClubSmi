"use client";

import { useState } from "react";
import { X } from "lucide-react";
import styles from "./NotifyListManager.module.scss";

type Row = {
  requestId: string;
  fullName: string;
  clubId: string;
  email: string;
  phoneNumber: string;
};

export default function NotifyListManager({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(requestId: string) {
    setRemovingId(requestId);

    try {
      const res = await fetch(`/api/admin/notify-requests/${requestId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.requestId !== requestId));
      }
    } catch (error) {
      console.error(error);
    }

    setRemovingId(null);
  }

  return (
    <>
      <div className={styles.count}>{rows.length} student(s) waiting</div>

      {rows.length === 0 ? (
        <div className={styles.empty}>No one has requested a notification yet.</div>
      ) : (
        <div className={styles.rows}>
          {rows.map((row) => (
            <div key={row.requestId} className={styles.row}>
              <div className={styles.rowInfo}>
                <strong>{row.fullName}</strong>
                <span>{row.clubId}</span>
              </div>

              <div className={styles.rowContact}>
                <span>{row.email}</span>
                <span>{row.phoneNumber}</span>
              </div>

              <button
                className={styles.removeButton}
                disabled={removingId === row.requestId}
                onClick={() => handleRemove(row.requestId)}
                title="Remove from notify list"
              >
                <X size={14} />
                {removingId === row.requestId ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
