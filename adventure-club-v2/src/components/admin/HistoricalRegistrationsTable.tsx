"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCheck } from "lucide-react";
import styles from "./RegistrationsTable.module.scss";
import LinkAccountModal from "./LinkAccountModal";

type Registration = {
  id: string;
  registrationNumber: string;
  isGuest: boolean;

  guestName: string | null;
  guestInstitution: string | null;
  guestDepartment: string | null;
  guestYear: string | null;
  guestPhoneNumber: string | null;

  initialPaymentPaid: boolean;
  finalPaymentPaid: boolean;
  attendanceMarked: boolean;
  certificateIssued: boolean;

  user: {
    id: string;
    clubId: string;
    fullName: string;
    institution: string;
    department: string;
    year: string;
    phoneNumber: string;
  } | null;
};

export default function HistoricalRegistrationsTable({ trekId }: { trekId: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [linkTarget, setLinkTarget] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRegistrations() {
    setLoading(true);

    try {
      const res = await fetch(`/api/registrations?trekId=${trekId}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  const filtered = useMemo(() => {
    const value = search.toLowerCase();

    return registrations.filter((r) => {
      const name = r.user?.fullName ?? r.guestName ?? "";
      const clubId = r.user?.clubId ?? "";
      const phone = r.user?.phoneNumber ?? r.guestPhoneNumber ?? "";

      return (
        name.toLowerCase().includes(value) ||
        clubId.toLowerCase().includes(value) ||
        phone.includes(value)
      );
    });
  }, [registrations, search]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Loading registrations...</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div>
          <h1>Archived Registrations</h1>
          <p>{registrations.length} Participants</p>
        </div>
      </div>

      <input
        className={styles.search}
        placeholder="Search by Name / Club ID / Phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <LinkAccountModal
        registrationId={linkTarget?.id ?? null}
        guestName={linkTarget?.guestName ?? ""}
        open={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        onLinked={fetchRegistrations}
      />

      <div className={styles.section}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No participants recorded for this trek yet.</p>
        ) : (
          filtered.map((registration, index) => {
            const name = registration.user?.fullName ?? registration.guestName ?? "Unknown";
            const institution =
              registration.user?.institution ?? registration.guestInstitution ?? "-";
            const department =
              registration.user?.department ?? registration.guestDepartment ?? "-";
            const year = registration.user?.year ?? registration.guestYear ?? "-";
            const phone =
              registration.user?.phoneNumber ?? registration.guestPhoneNumber ?? "-";

            return (
              <div key={registration.id} className={styles.card}>
                <div className={styles.left}>
                  <div className={styles.number}>{index + 1}</div>

                  <div>
                    <h3>{name}</h3>
                    <p>{registration.user?.clubId ?? "Guest record"}</p>
                    <p>
                      {institution} • {department}
                    </p>
                    <p>{year}</p>
                    <p>{phone}</p>
                    <p>
                      {registration.initialPaymentPaid ? "Initial Paid" : "Initial Unpaid"} •{" "}
                      {registration.finalPaymentPaid ? "Final Paid" : "Final Unpaid"} •{" "}
                      {registration.attendanceMarked ? "Attended" : "Not Marked"} •{" "}
                      {registration.certificateIssued ? "Certificate Issued" : "No Certificate"}
                    </p>
                  </div>
                </div>

                <div className={styles.right}>
                  {registration.user ? (
                    <span className={`${styles.badge} ${styles.registrationcomplete}`}>
                      Linked to Account
                    </span>
                  ) : (
                    <button
                      className={styles.viewButton}
                      onClick={() => setLinkTarget(registration)}
                    >
                      <UserCheck size={14} style={{ marginRight: 6 }} />
                      Link to Account
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
