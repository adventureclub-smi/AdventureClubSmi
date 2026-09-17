"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  Unlock,
  FlagTriangleRight,
  MessageCircle,
  Download,
  LayoutGrid,
  Table2,
} from "lucide-react";
import styles from "./PaymentsTable.module.scss";
import PaymentDrawer from "./PaymentDrawer";
import type { PaymentRegistration } from "./types";

type Registration = PaymentRegistration;

interface Props {
  trekId: string;
}

type FilterOption =
  | "all"
  | "initialPaid"
  | "initialDidNotPay"
  | "initialPending"
  | "secondPaid"
  | "secondDidNotPay"
  | "secondPending"
  | "finalPaid"
  | "finalDidNotPay"
  | "finalPending"
  | "removed";

type SortOption = "nameAsc" | "nameDesc" | "orderAsc" | "orderDesc";

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All Participants" },
  { value: "initialPaid", label: "Initial: Paid" },
  { value: "initialDidNotPay", label: "Initial: Didn't Pay" },
  { value: "initialPending", label: "Initial: Pending" },
  { value: "secondPaid", label: "Second: Paid" },
  { value: "secondDidNotPay", label: "Second: Didn't Pay" },
  { value: "secondPending", label: "Second: Pending" },
  { value: "finalPaid", label: "Final: Paid" },
  { value: "finalDidNotPay", label: "Final: Didn't Pay" },
  { value: "finalPending", label: "Final: Pending" },
  { value: "removed", label: "Removed from Payments" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "nameAsc", label: "Name (A–Z)" },
  { value: "nameDesc", label: "Name (Z–A)" },
  { value: "orderAsc", label: "Registration # (Low–High)" },
  { value: "orderDesc", label: "Registration # (High–Low)" },
];

// Single source of truth for a payment leg's text label — used by the
// table view and the Excel export below, so neither can drift out of
// sync with what the card view already shows for the same registration.
function paymentStatusText(
  registration: Registration,
  type: "initial" | "second" | "final"
): string {
  if (type === "initial") {
    if (registration.initialPaymentPaid) return "Paid";
    if (registration.initialPaymentDidNotPay) return "Didn't Pay";
    return "Pending";
  }

  if (type === "second") {
    const second = registration.payments?.find((p) => p.type === "SECOND");
    if (registration.secondPaymentPaid) return "Paid";
    if (registration.secondPaymentDidNotPay) return "Didn't Pay";
    if (second?.status === "PENDING") return "Waiting Verification";
    if (registration.secondPaymentUnlocked) return "Unlocked";
    return "Locked";
  }

  const final = registration.payments?.find((p) => p.type === "FINAL");
  if (registration.finalPaymentPaid) {
    return registration.finalPaymentPaidAtOnce ? "Paid At Once" : "Paid";
  }
  if (registration.finalPaymentDidNotPay) return "Didn't Pay";
  if (final?.status === "PENDING") return "Waiting Verification";
  if (registration.finalPaymentUnlocked) return "Unlocked";
  return "Locked";
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function PaymentsTable({ trekId }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [trekStatus, setTrekStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [unlockingAll, setUnlockingAll] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState("");
  const [completingTrek, setCompletingTrek] = useState(false);
  const [completeStatus, setCompleteStatus] = useState("");
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);

  async function fetchPayments() {
    try {
      const res = await fetch(`/api/admin/payments/${trekId}`);
      const data = await res.json();
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      setTrekStatus(data.trekStatus ?? null);
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
        if (active) {
          setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
          setTrekStatus(data.trekStatus ?? null);
        }
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

  async function sendWhatsappInvite(registrationId: string) {
    setSendingInviteId(registrationId);

    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}/resend-whatsapp-invite`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to send WhatsApp invite.");
        return;
      }

      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSendingInviteId(null);
    }
  }

  async function toggleWhatsappGroup(registrationId: string, current: boolean) {
    setTogglingGroupId(registrationId);

    try {
      await fetch(`/api/admin/registrations/${registrationId}/whatsapp-group-joined`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joined: !current }),
      });

      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setTogglingGroupId(null);
    }
  }

  async function handleUnlockAll(type?: "SECOND") {
    const confirmUnlock = confirm(
      type === "SECOND"
        ? "Unlock second payment for every approved participant on this trek — including anyone who hasn't finished paying Initial yet?"
        : "Unlock final payment for every participant who has completed their initial payment on this trek?"
    );

    if (!confirmUnlock) return;

    setUnlockingAll(true);
    setUnlockStatus("");

    try {
      const res = await fetch("/api/admin/payments/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId, type }),
      });

      const data = await res.json();

      setUnlockStatus(data.message || "Done.");
      fetchPayments();
    } finally {
      setUnlockingAll(false);
    }
  }

  const isSingleInstallment = registrations[0]?.trek?.installments === 1;
  const hasSecondInstallment = registrations[0]?.trek?.installments === 3;

  // registrations.some(...) alone is always false on a trek with zero
  // registrations, no matter what the trek's own status actually is — so
  // that case falls back to trekStatus, which the API now sends directly.
  const trekCompleted =
    trekStatus === "Completed" ||
    registrations.some((r) => r.status === "COMPLETED" || r.status === "MISSED");

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

  // Signup order (registrations arrives ordered by createdAt from the API)
  // — only used to drive the "Registration # (Low-High/High-Low)" sort
  // options below. The number actually shown on each row is a plain 1..n
  // position in whatever's currently displayed (see the `i + 1` in each
  // view), not this — that's the Registrations page's own numbering, which
  // has nothing to do with this section.
  const registrationOrder = useMemo(() => {
    const order = new Map<string, number>();
    registrations.forEach((r, i) => order.set(r.id, i + 1));
    return order;
  }, [registrations]);

  const filtered = useMemo(() => {
    const bySearchAndFilter = registrations.filter((registration) => {
      const name = registration.user?.fullName ?? registration.guestName ?? "";
      const clubId = registration.user?.clubId ?? "";
      const phone = registration.user?.phoneNumber ?? "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        clubId.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search);

      if (!matchesSearch) return false;

      // Removed-from-payments registrations stay out of every other view —
      // "Removed from Payments" is the only filter that shows them.
      if (filterBy === "removed") return !!registration.hiddenFromPayments;
      if (registration.hiddenFromPayments) return false;

      switch (filterBy) {
        case "initialPaid":
          return registration.initialPaymentPaid;
        case "initialDidNotPay":
          return !registration.initialPaymentPaid && registration.initialPaymentDidNotPay;
        case "initialPending":
          return !registration.initialPaymentPaid && !registration.initialPaymentDidNotPay;
        case "secondPaid":
          return registration.secondPaymentPaid;
        case "secondDidNotPay":
          return !registration.secondPaymentPaid && registration.secondPaymentDidNotPay;
        case "secondPending":
          return !registration.secondPaymentPaid && !registration.secondPaymentDidNotPay;
        case "finalPaid":
          return registration.finalPaymentPaid;
        case "finalDidNotPay":
          return !registration.finalPaymentPaid && registration.finalPaymentDidNotPay;
        case "finalPending":
          return !registration.finalPaymentPaid && !registration.finalPaymentDidNotPay;
        default:
          return true;
      }
    });

    const nameOf = (r: Registration) => r.user?.fullName ?? r.guestName ?? "";

    return [...bySearchAndFilter].sort((a, b) => {
      switch (sortBy) {
        case "nameDesc":
          return nameOf(b).localeCompare(nameOf(a));
        case "orderAsc":
          return (registrationOrder.get(a.id) ?? 0) - (registrationOrder.get(b.id) ?? 0);
        case "orderDesc":
          return (registrationOrder.get(b.id) ?? 0) - (registrationOrder.get(a.id) ?? 0);
        default:
          return nameOf(a).localeCompare(nameOf(b));
      }
    });
  }, [registrations, search, filterBy, sortBy, registrationOrder]);

  // Exports exactly what's currently on screen — same search/filter/sort as
  // the cards or table above it, so "everyone shown" and "everyone in the
  // file" always match. A .csv (not a real .xlsx) since Excel opens it
  // natively either way, with no extra library needed.
  function exportToExcel() {
    const headers = [
      "#",
      "Name",
      "Club ID",
      "Phone",
      isSingleInstallment ? "Full Payment" : "Initial Payment",
      ...(hasSecondInstallment ? ["Second Payment"] : []),
      ...(!isSingleInstallment ? ["Final Payment"] : []),
      "Amount",
      "Method",
      "Bond Form",
      "WhatsApp Invite",
      "WhatsApp Group",
    ];

    const rows = filtered.map((registration, i) => {
      const name =
        (registration.user?.fullName ?? registration.guestName ?? "Unknown Participant") +
        (registration.hiddenFromPayments ? " (Removed)" : "");

      return [
        String(i + 1),
        name,
        registration.user?.clubId ?? "-",
        registration.user?.phoneNumber ?? "-",
        paymentStatusText(registration, "initial"),
        ...(hasSecondInstallment ? [paymentStatusText(registration, "second")] : []),
        ...(!isSingleInstallment ? [paymentStatusText(registration, "final")] : []),
        String(registration.paymentAmount ?? 0),
        registration.paymentMethod ?? "Not Recorded",
        registration.bondFormSubmitted ? "Submitted" : "Pending",
        registration.whatsappInviteSentAt ? "Sent" : "Not Sent",
        registration.whatsappGroupJoined ? "In Group" : "Not in Group",
      ];
    });

    // Leading ﻿ (UTF-8 BOM) so Excel doesn't mangle names with
    // accented/non-ASCII characters when it opens the file.
    const csv =
      "﻿" +
      [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${trekId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(() => {
    // Removed-from-payments registrations skip every stat here too — they're
    // meant to be out of payment tracking, not just hidden from the list.
    const visible = registrations.filter((r) => !r.hiddenFromPayments);

    const participants = visible.length;
    const initialPaid = visible.filter((r) => r.initialPaymentPaid).length;
    const finalPaid = visible.filter((r) => r.finalPaymentPaid).length;
    const pending = visible.filter((r) => !r.initialPaymentPaid).length;

    const collected = visible.reduce(
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

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className={styles.resultCount}>{filtered.length} shown</span>

        <div className={styles.viewToggle}>
          <button
            type="button"
            className={viewMode === "cards" ? styles.viewActive : ""}
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid size={14} /> Cards
          </button>
          <button
            type="button"
            className={viewMode === "table" ? styles.viewActive : ""}
            onClick={() => setViewMode("table")}
          >
            <Table2 size={14} /> Table
          </button>
        </div>

        <button type="button" className={styles.exportButton} onClick={exportToExcel}>
          <Download size={14} /> Export to Excel
        </button>
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

      <div className={styles.bulkActions}>
        {hasSecondInstallment && (
          <button
            className={styles.unlockAllButton}
            disabled={unlockingAll}
            onClick={() => handleUnlockAll("SECOND")}
          >
            <Unlock size={15} />
            {unlockingAll ? "Unlocking..." : "Unlock Second Payment for All"}
          </button>
        )}

        {!isSingleInstallment && (
          <button
            className={styles.unlockAllButton}
            disabled={unlockingAll}
            onClick={() => handleUnlockAll()}
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

      {viewMode === "table" ? (
        filtered.length === 0 ? (
          <div className={styles.empty}>No participants found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Club ID</th>
                  <th>{isSingleInstallment ? "Full" : "Initial"}</th>
                  {hasSecondInstallment && <th>Second</th>}
                  {!isSingleInstallment && <th>Final</th>}
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((registration, i) => (
                  <tr key={registration.id} onClick={() => setSelected(registration)}>
                    <td>{i + 1}</td>
                    <td>
                      {registration.user?.fullName ?? registration.guestName ?? "Unknown Participant"}
                      {registration.hiddenFromPayments && (
                        <span className={styles.removedTag}>Removed</span>
                      )}
                    </td>
                    <td>{registration.user?.clubId ?? "-"}</td>
                    <td>{paymentStatusText(registration, "initial")}</td>
                    {hasSecondInstallment && <td>{paymentStatusText(registration, "second")}</td>}
                    {!isSingleInstallment && <td>{paymentStatusText(registration, "final")}</td>}
                    <td>₹{registration.paymentAmount ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.manage}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(registration);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
      <div className={styles.cards}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No participants found.</div>
        ) : (
          filtered.map((registration, i) => {
            const participant =
              registration.user?.fullName ?? registration.guestName ?? "Unknown Participant";
            const clubId = registration.user?.clubId ?? "-";
            const secondPayment = registration.payments?.find((p) => p.type === "SECOND");
            const finalPayment = registration.payments?.find((p) => p.type === "FINAL");

            return (
              <div key={registration.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.nameRow}>
                    <span className={styles.orderNumber}>{i + 1}</span>

                    <div>
                      <h3>
                        {participant}
                        {registration.hiddenFromPayments && (
                          <span className={styles.removedTag}>Removed</span>
                        )}
                      </h3>
                      <p>{clubId}</p>
                    </div>
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

                  {hasSecondInstallment && (
                    <div className={styles.infoCard}>
                      <span>Second Payment</span>

                      {registration.secondPaymentPaid ? (
                        <strong className={styles.success}>
                          <CheckCircle2 size={15} /> Paid
                        </strong>
                      ) : registration.secondPaymentDidNotPay ? (
                        <strong className={styles.danger}>
                          <XCircle size={15} /> Didn&apos;t Pay
                        </strong>
                      ) : secondPayment?.status === "PENDING" ? (
                        <strong className={styles.warning}>
                          <Clock size={15} /> Waiting Verification
                        </strong>
                      ) : registration.secondPaymentUnlocked ? (
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

                  {!isSingleInstallment && (
                    <div className={styles.infoCard}>
                      <span>Final Payment</span>

                      {registration.finalPaymentPaid ? (
                        <strong className={styles.success}>
                          <CheckCircle2 size={15} />{" "}
                          {registration.finalPaymentPaidAtOnce ? "Paid At Once" : "Paid"}
                        </strong>
                      ) : registration.finalPaymentDidNotPay ? (
                        <strong className={styles.danger}>
                          <XCircle size={15} /> Didn&apos;t Pay
                        </strong>
                      ) : finalPayment?.status === "PENDING" ? (
                        <strong className={styles.warning}>
                          <Clock size={15} /> Waiting Verification
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

                  {(registration.initialPaymentPaid || registration.offlinePaymentVerified) && (
                    <div className={styles.infoCard}>
                      <span>WhatsApp Invite</span>

                      {registration.whatsappInviteSentAt ? (
                        <strong className={styles.success}>
                          <CheckCircle2 size={15} /> Sent
                        </strong>
                      ) : (
                        <strong className={styles.warning}>
                          <MessageCircle size={15} /> Not Sent
                        </strong>
                      )}

                      <button
                        className={styles.whatsappButton}
                        disabled={sendingInviteId === registration.id}
                        onClick={() => sendWhatsappInvite(registration.id)}
                      >
                        {sendingInviteId === registration.id
                          ? "Sending..."
                          : registration.whatsappInviteSentAt
                          ? "Resend Invite"
                          : "Send Invite"}
                      </button>
                    </div>
                  )}

                  {(registration.initialPaymentPaid || registration.offlinePaymentVerified) && (
                    <div className={styles.infoCard}>
                      <span>WhatsApp Group</span>

                      {registration.whatsappGroupJoined ? (
                        <strong className={styles.success}>
                          <CheckCircle2 size={15} /> In Group
                        </strong>
                      ) : (
                        <strong className={styles.warning}>
                          <XCircle size={15} /> Not in Group Yet
                        </strong>
                      )}

                      {registration.user?.phoneNumber && (
                        <p className={styles.phoneHint}>{registration.user.phoneNumber}</p>
                      )}

                      <button
                        className={registration.whatsappGroupJoined ? styles.undoBond : styles.whatsappButton}
                        disabled={togglingGroupId === registration.id}
                        onClick={() =>
                          toggleWhatsappGroup(registration.id, registration.whatsappGroupJoined)
                        }
                      >
                        {togglingGroupId === registration.id
                          ? "Updating..."
                          : registration.whatsappGroupJoined
                          ? "Undo"
                          : "Mark In Group"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

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
