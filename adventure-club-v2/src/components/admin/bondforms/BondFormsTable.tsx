"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, Clock } from "lucide-react";
import styles from "./BondFormsTable.module.scss";

type BondFormRegistration = {
  id: string;
  bondFormSubmitted: boolean;
  guestName: string | null;
  user: {
    fullName: string;
    clubId: string;
    phoneNumber?: string;
  } | null;
};

type FilterOption = "all" | "submitted" | "pending";

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All Participants" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Yet to Submit" },
];

export default function BondFormsTable({ trekId }: { trekId: string }) {
  const [registrations, setRegistrations] = useState<BondFormRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchRegistrations() {
    try {
      // Same dataset the Payments tab already shows bond form status
      // from — reused here rather than duplicating the query, so this
      // list can never drift out of sync with that one.
      const res = await fetch(`/api/admin/payments/${trekId}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trekId]);

  async function toggleBondForm(registrationId: string, current: boolean) {
    setTogglingId(registrationId);

    try {
      await fetch(`/api/admin/bond-form/${registrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bondFormSubmitted: !current }),
      });

      await fetchRegistrations();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  const stats = useMemo(() => {
    const total = registrations.length;
    const submitted = registrations.filter((r) => r.bondFormSubmitted).length;
    return { total, submitted, pending: total - submitted };
  }, [registrations]);

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const name = registration.user?.fullName ?? registration.guestName ?? "";
      const clubId = registration.user?.clubId ?? "";
      const phone = registration.user?.phoneNumber ?? "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        clubId.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search);

      if (!matchesSearch) return false;

      switch (filterBy) {
        case "submitted":
          return registration.bondFormSubmitted;
        case "pending":
          return !registration.bondFormSubmitted;
        default:
          return true;
      }
    });
  }, [registrations, search, filterBy]);

  if (loading) {
    return <div className={styles.loading}>Loading bond forms...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p>Track bond form submissions for every participant on this trek.</p>

        <div className={styles.searchWrap}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name / club ID / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      <div className={styles.filterBar}>
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as FilterOption)}>
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className={styles.resultCount}>{filtered.length} shown</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h2>{stats.total}</h2>
          <span>Total Participants</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.submitted}</h2>
          <span>Submitted</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.pending}</h2>
          <span>Yet to Submit</span>
        </div>
      </div>

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
                <div>
                  <h3>{participant}</h3>
                  <p>{clubId}</p>
                  {registration.user?.phoneNumber && (
                    <p className={styles.phoneHint}>{registration.user.phoneNumber}</p>
                  )}
                </div>

                <div className={styles.status}>
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
                    className={registration.bondFormSubmitted ? styles.undoButton : styles.submitButton}
                    disabled={togglingId === registration.id}
                    onClick={() => toggleBondForm(registration.id, registration.bondFormSubmitted)}
                  >
                    {togglingId === registration.id
                      ? "Updating..."
                      : registration.bondFormSubmitted
                      ? "Undo"
                      : "Mark Submitted"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
