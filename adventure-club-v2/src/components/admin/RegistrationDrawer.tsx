"use client";

import { useEffect, useState } from "react";
import styles from "./RegistrationDrawer.module.scss";

type Registration = {
  id: string;
  registrationNumber: string;
  status: string;
  initialPaymentDeadline: string | null;
  remarks: string | null;

  paymentPortal: boolean;

  user: {
    id: string;
    clubId: string;
    fullName: string;
    institution: string;
    department: string;
    year: string;
    phoneNumber: string;

    upiId?: string | null;
    upiPhone?: string | null;
  };
};

type Props = {
  open: boolean;
  registration: Registration | null;
  onClose: () => void;
  onRefresh: () => void;
};

export default function RegistrationDrawer({
  open,
  registration,
  onClose,
  onRefresh,
}: Props) {
  const [status, setStatus] = useState("Waiting");
  const [remarks, setRemarks] = useState("");
  const [deadline, setDeadline] = useState("3");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!registration) return;

    setStatus(registration.status);
    setRemarks(registration.remarks || "");
  }, [registration]);

 async function saveChanges() {
  if (!registration) return;

  setSaving(true);

  try {
    const res = await fetch(
      `/api/registrations/${registration.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          remarks,
          paymentDays: Number(deadline),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      setSaving(false);
      return;
    }

    alert("Registration updated!");

    onRefresh();
    onClose();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }

  setSaving(false);
}

  async function addToPaymentPortal() {
  if (!registration) return;

  try {
    const res = await fetch(
      "/api/admin/payments/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId: registration.id,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Participant added to Payment Portal.");

    onRefresh();
    onClose();

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
}

  async function deleteRegistration() {
    if (!registration) return;

    const confirmed = window.confirm(
      "Delete this registration permanently?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `/api/registrations/${registration.id}/delete`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setDeleting(false);
        return;
      }

      alert("Registration deleted.");

      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setDeleting(false);
  }

  if (!open || !registration) return null;

  return (
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
      />

      <aside className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <p className={styles.label}>
              Registration
            </p>

            <h2>
              {registration.user.fullName}
            </h2>

            <span className={styles.clubId}>
              {registration.user.clubId}
            </span>
          </div>

          <button
            className={styles.close}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>
            Current Status
          </span>

          <div
            className={`${styles.badge} ${
              styles[
                status
                  .toLowerCase()
                  .replace(/\s/g, "")
              ]
            }`}
          >
            {status}
          </div>
        </div>

        <div className={styles.quickActions}>
          <button
            className={styles.approve}
            onClick={() =>
              setStatus("Approved")
            }
          >
            🟢
            <div>
              <strong>Approve</strong>
              <small>
                Unlock initial payment
              </small>
            </div>
          </button>

          <button
            className={styles.wait}
            onClick={() =>
              setStatus("Waiting")
            }
          >
            🟡
            <div>
              <strong>Waiting</strong>
              <small>
                Keep registration pending
              </small>
            </div>
          </button>

          <button
            className={styles.reject}
            onClick={() =>
              setStatus("Rejected")
            }
          >
            🔴
            <div>
              <strong>Reject</strong>
              <small>
                Decline registration
              </small>
            </div>
          </button>
        </div>

                {/* STUDENT INFORMATION */}

        {/* ================= STUDENT INFORMATION ================= */}

<div className={styles.card}>
  <h3>Student Information</h3>

  <div className={styles.item}>
  <span>Institution</span>
  <strong>{registration.user?.institution}</strong>
</div>

<div className={styles.item}>
  <span>Department</span>
  <strong>{registration.user?.department}</strong>
</div>

<div className={styles.item}>
  <span>Year</span>
  <strong>{registration.user?.year}</strong>
</div>

<div className={styles.item}>
  <span>Phone Number</span>
  <strong>{registration.user?.phoneNumber}</strong>
</div>

<div className={styles.divider}></div>

<h4 className={styles.subHeading}>
  💸 Reimbursement Details
</h4>

<div className={styles.item}>
  <span>UPI ID</span>
  <strong>{registration.user?.upiId || "Not Added"}</strong>
</div>

<div className={styles.item}>
  <span>UPI Phone</span>
  <strong>{registration.user?.upiPhone || "Not Added"}</strong>
</div>
</div>

        {/* PAYMENT DEADLINE */}

        <div className={styles.card}>
          <h3>Payment Deadline</h3>

          <p className={styles.cardDescription}>
            Select how many days the participant has
            to complete the initial payment after
            approval.
          </p>

          <div className={styles.deadlineGrid}>
            <button
              type="button"
              className={
                deadline === "1"
                  ? styles.activeDeadline
                  : ""
              }
              onClick={() => setDeadline("1")}
            >
              1 Day
            </button>

            <button
              type="button"
              className={
                deadline === "2"
                  ? styles.activeDeadline
                  : ""
              }
              onClick={() => setDeadline("2")}
            >
              2 Days
            </button>

            <button
              type="button"
              className={
                deadline === "3"
                  ? styles.activeDeadline
                  : ""
              }
              onClick={() => setDeadline("3")}
            >
              3 Days
            </button>

            <button
              type="button"
              className={
                deadline === "7"
                  ? styles.activeDeadline
                  : ""
              }
              onClick={() => setDeadline("7")}
            >
              7 Days
            </button>
          </div>
        </div>

        {/* ADMIN NOTES */}

        <div className={styles.card}>
          <h3>Admin Notes</h3>

          <textarea
            rows={6}
            placeholder="Private notes visible only to admins..."
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
          />
        </div>

                {/* TIMELINE */}

        <div className={styles.card}>
          <h3>Registration Timeline</h3>

          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div>
                <strong>Registration Submitted</strong>
                <p>
                  Student successfully registered for
                  this trek.
                </p>
              </div>
            </div>

            {status !== "Waiting" && (
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <strong>Status Updated</strong>
                  <p>
                    Registration status changed to{" "}
                    <b>{status}</b>.
                  </p>
                </div>
              </div>
            )}

            {status === "Approved" && (
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <strong>Initial Payment</strong>
                  <p>
                    Student can now pay the initial
                    trek amount.
                  </p>
                </div>
              </div>
            )}

            {status ===
              "Registration Complete" && (
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div>
                  <strong>Registration Complete</strong>
                  <p>
                    Participant is officially
                    confirmed for the trek.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
  <h3>Payment Portal</h3>

  {registration.paymentPortal ? (
    <>
      <p>
        ✅ Participant has been added to the
        Payment Portal.
      </p>

      <button
        className={styles.secondaryButton}
        disabled
      >
        Added
      </button>
    </>
  ) : (
    <>
      <p>
        Allow this participant to appear
        inside the Payments page.
      </p>

      <button
        className={styles.primaryButton}
        onClick={addToPaymentPortal}
      >
        Add to Payments
      </button>
    </>
  )}
</div>

        {/* DANGER ZONE */}

        <div className={styles.dangerCard}>
          <h3>Danger Zone</h3>

          <p>
            Deleting this registration will remove the
            participant from the trek. This action
            cannot be undone.
          </p>

          <button
            className={styles.deleteButton}
            onClick={deleteRegistration}
            disabled={deleting}
          >
            {deleting
              ? "Deleting..."
              : "Delete Registration"}
          </button>
        </div>

        {/* FOOTER */}

        <div className={styles.footer}>
          <button
            className={styles.cancel}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className={styles.save}
            disabled={saving}
            onClick={saveChanges}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </aside>
    </>
  );
}