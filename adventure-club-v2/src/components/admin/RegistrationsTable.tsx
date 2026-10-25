"use client";

import { useEffect, useMemo, useState } from "react";
import { FlagTriangleRight } from "lucide-react";
import styles from "./RegistrationsTable.module.scss";
import AddParticipantModal from "./AddParticipantModal";
import RegistrationDrawer from "./RegistrationDrawer";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import { getPaymentBadge } from "@/lib/registration-journey";
import { isSmiInstitution } from "@/lib/institution";
import { useCountdown } from "@/hooks/useCountdown";

// Admins asked to see exactly when someone signed up (down to the second),
// not just the date — useful for sorting out disputes about who registered
// first when seats are limited.
function formatRegisteredAt(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// Each approved-but-unpaid registration has its own initialPaymentDeadline
// (set when it was approved), so this ticks down that specific person's own
// remaining time rather than one shared countdown for the whole list.
function PaymentDeadlineCountdown({ deadline }: { deadline: string }) {
  const { days, hours, minutes, passed } = useCountdown(deadline);

  if (passed) {
    return <span className={styles.deadlinePassed}>Payment deadline passed</span>;
  }

  return (
    <span className={styles.deadlineCountdown}>
      {days > 0 && `${days}d `}
      {hours}h {minutes}m left to pay
    </span>
  );
}

type Registration = {
  id: string;
  registrationNumber: string;
  status: string;
  initialPaymentDeadline: string | null;
  remarks: string | null;
  createdAt: string;

  paymentPortal: boolean;
  whatsappGroupJoined: boolean;

  // Payment/journey fields — only needed so getPaymentBadge() can compute
  // the payment badge below; not otherwise rendered directly.
  initialPaymentPaid: boolean;
  initialPaymentDidNotPay?: boolean;
  offlinePaymentCreated: boolean;
  offlinePaymentVerified: boolean;
  bondFormSubmitted: boolean;
  attendanceMarked: boolean;
  finalPaymentUnlocked: boolean;
  finalPaymentPaid: boolean;
  finalPaymentDidNotPay?: boolean;
  finalPaymentPaidAtOnce?: boolean;
  certificateIssued: boolean;

  user: {
    id: string;
    clubId: string;
    fullName: string;
    email?: string;
    institution: string;
    department: string;
    year: string;
    phoneNumber: string;

    upiId?: string | null;
    upiPhone?: string | null;
  } | null;

  isGuest: boolean;
  guestName: string | null;
  guestRollNo: string | null;
  guestEmail?: string | null;
  guestInstitution: string | null;
  guestDepartment: string | null;
  guestYear: string | null;
  guestPhoneNumber: string | null;
};

export default function RegistrationsTable({
  trekId,
}: {
  trekId: string;
}) {
  const [registrations, setRegistrations] = useState<
    Registration[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showAddParticipant, setShowAddParticipant] =
    useState(false);

  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  type RegistrationMode = "auto" | "open" | "closed" | "core";

  const [registrationMode, setRegistrationModeState] =
    useState<RegistrationMode>("auto");

  const [togglingStatus, setTogglingStatus] = useState(false);

  const [sendingReminder, setSendingReminder] = useState(false);

  // Free entries (price 0 — most workshops) have nothing to pay, so they
  // never get a Payments tab (see the trek layout's isFreeEntry gating) —
  // "Mark Trek Completed" would otherwise have no home for them at all,
  // since that's normally where this action lives.
  const [trekPrice, setTrekPrice] = useState<number | null>(null);
  const [trekType, setTrekType] = useState<string | null>(null);
  const [trekStatus, setTrekStatus] = useState<string | null>(null);
  const [completingTrek, setCompletingTrek] = useState(false);
  const [completeStatus, setCompleteStatus] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeadline, setBulkDeadline] = useState("3");
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    fetchTrekStatus();
  }, []);

  async function fetchTrekStatus() {
    try {
      const res = await fetch(`/api/treks/${trekId}`);
      const data = await res.json();

      setRegistrationModeState(
        data.registrationClosedManually
          ? "closed"
          : data.registrationOpenedManually
          ? "open"
          : data.registrationOpenForCoreOnly
          ? "core"
          : "auto"
      );

      setTrekPrice(data.price ?? null);
      setTrekType(data.type ?? null);
      setTrekStatus(data.status ?? null);
    } catch (error) {
      console.error(error);
    }
  }

  const isFreeEntry = trekPrice === 0;
  const isWorkshop = trekType === "WORKSHOP";

  const trekCompleted =
    trekStatus === "Completed" ||
    registrations.some((r) => r.status === "COMPLETED" || r.status === "MISSED");

  async function handleCompleteTrek() {
    const confirmComplete = confirm(
      trekCompleted
        ? `Undo ${isWorkshop ? "session" : "trek"} completion? Every completed/missed participant on this ${
            isWorkshop ? "session" : "trek"
          } reverts to Approved.`
        : "Mark this as completed? Participants marked present will show as Trip Completed, everyone else as Trip Missed. You can undo this anytime."
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
      fetchRegistrations();
      fetchTrekStatus();
    } finally {
      setCompletingTrek(false);
    }
  }

  // Emails everyone approved for this trek who still hasn't paid their
  // initial payment (and hasn't already submitted offline proof that's
  // just awaiting verification) — see the route for the exact definition.
  async function sendPaymentReminder() {
    setSendingReminder(true);

    try {
      const res = await fetch(`/api/admin/treks/${trekId}/remind-payment`, {
        method: "POST",
      });

      const data = await res.json();

      alert(data.message || "Something went wrong.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSendingReminder(false);
    }
  }

  async function setRegistrationMode(mode: RegistrationMode) {
    if (mode === registrationMode) return;

    setTogglingStatus(true);

    try {
      const action =
        mode === "open" ? "open" : mode === "closed" ? "close" : mode === "core" ? "core" : "auto";

      const res = await fetch("/api/admin/treks/registration-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId, action }),
      });

      if (res.ok) {
        setRegistrationModeState(mode);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingStatus(false);
    }
  }

  async function fetchRegistrations() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/registrations?trekId=${trekId}`
      );

      const data = await res.json();

      setRegistrations(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  function openDrawer(
    registration: Registration
  ) {
    setSelectedRegistration(registration);

    setDrawerOpen(true);
  }

  function toggleSelected(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllWaiting() {
    const waitingIds = registrations
      .filter((r) => r.status === "WAITING")
      .map((r) => r.id);

    setSelectedIds(new Set(waitingIds));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkApprove() {
    if (selectedIds.size === 0) return;

    const confirmApprove = confirm(
      `Approve ${selectedIds.size} selected registration${
        selectedIds.size === 1 ? "" : "s"
      }?`
    );

    if (!confirmApprove) return;

    setBulkApproving(true);

    try {
      const res = await fetch("/api/registrations/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: "Approved",
          paymentDays: Number(bulkDeadline),
        }),
      });

      const data = await res.json();

      alert(data.message || "Done.");

      clearSelection();
      fetchRegistrations();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setBulkApproving(false);
    }
  }

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const value = search.toLowerCase();

      const name = registration.user?.fullName ?? registration.guestName ?? "";
      const clubId = registration.user?.clubId ?? registration.guestRollNo ?? "";
      const phone = registration.user?.phoneNumber ?? registration.guestPhoneNumber ?? "";

      return (
        name.toLowerCase().includes(value) ||
        clubId.toLowerCase().includes(value) ||
        phone.includes(value)
      );
    });
  }, [registrations, search]);

  const smiStudents = filtered.filter((r) =>
    isSmiInstitution(r.user?.institution ?? r.guestInstitution ?? "")
  );

  const otherStudents = filtered.filter(
    (r) => !isSmiInstitution(r.user?.institution ?? r.guestInstitution ?? "")
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Loading registrations...</h2>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div>
            <h1>Registrations</h1>

            <p>
              {registrations.length} Participants
            </p>
          </div>

          <div className={styles.topBarActions}>
            <div className={styles.registrationModeGroup}>
              <button
                className={
                  registrationMode === "auto"
                    ? styles.modeButtonActiveAuto
                    : styles.modeButton
                }
                onClick={() => setRegistrationMode("auto")}
                disabled={togglingStatus || registrationMode === "auto"}
              >
                Follow Countdown
              </button>

              <button
                className={
                  registrationMode === "open"
                    ? styles.modeButtonActiveOpen
                    : styles.modeButton
                }
                onClick={() => setRegistrationMode("open")}
                disabled={togglingStatus || registrationMode === "open"}
              >
                Open Registrations
              </button>

              <button
                className={
                  registrationMode === "closed"
                    ? styles.modeButtonActiveClosed
                    : styles.modeButton
                }
                onClick={() => setRegistrationMode("closed")}
                disabled={togglingStatus || registrationMode === "closed"}
              >
                Close Registrations
              </button>

              <button
                className={
                  registrationMode === "core"
                    ? styles.modeButtonActiveCore
                    : styles.modeButton
                }
                onClick={() => setRegistrationMode("core")}
                disabled={togglingStatus || registrationMode === "core"}
                title="Only club roles other than Member, Registered Member, Participant, and Pending can register while this is active"
              >
                Open for Core Members
              </button>
            </div>

            {!isFreeEntry && (
              <button
                className={styles.reminderButton}
                onClick={sendPaymentReminder}
                disabled={sendingReminder}
                title="Emails everyone approved for this trek who hasn't paid their initial payment yet"
              >
                {sendingReminder ? "Sending..." : "Send Payment Reminder"}
              </button>
            )}

            {isFreeEntry && (
              <button
                type="button"
                className={trekCompleted ? styles.undoCompleteButton : styles.completeTrekButton}
                onClick={handleCompleteTrek}
                disabled={completingTrek}
              >
                <FlagTriangleRight size={15} />
                {completingTrek
                  ? "Working..."
                  : trekCompleted
                  ? `Undo ${isWorkshop ? "Session" : "Trek"} Completion`
                  : `Mark ${isWorkshop ? "Session" : "Trek"} Completed`}
              </button>
            )}

            <button
              className={styles.addButton}
              onClick={() =>
                setShowAddParticipant(true)
              }
            >
              + Add Participant
            </button>
          </div>

          {completeStatus && <p className={styles.completeStatus}>{completeStatus}</p>}
        </div>

        <input
          className={styles.search}
          placeholder="Search by Name / Club ID / Phone"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <div className={styles.bulkBar}>
          <button
            type="button"
            className={styles.bulkSelectAllButton}
            onClick={selectAllWaiting}
          >
            Select All Waiting
          </button>

          {selectedIds.size > 0 && (
            <>
              <span className={styles.bulkCount}>
                {selectedIds.size} selected
              </span>

              <div className={styles.bulkDeadlineGroup}>
                {[
                  { value: "1", label: "1 Day" },
                  { value: "2", label: "2 Days" },
                  { value: "3", label: "3 Days" },
                  { value: "7", label: "7 Days" },
                  { value: "0", label: "Always Open" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={
                      bulkDeadline === opt.value ? styles.bulkDeadlineActive : ""
                    }
                    onClick={() => setBulkDeadline(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.bulkApproveButton}
                onClick={bulkApprove}
                disabled={bulkApproving}
              >
                {bulkApproving
                  ? "Approving..."
                  : `Approve ${selectedIds.size}`}
              </button>

              <button
                type="button"
                className={styles.bulkClearButton}
                onClick={clearSelection}
              >
                Clear
              </button>
            </>
          )}
        </div>

        <AddParticipantModal
          trekId={trekId}
          open={showAddParticipant}
          onClose={() =>
            setShowAddParticipant(false)
          }
          onAdded={fetchRegistrations}
        />

        <RegistrationDrawer
          open={drawerOpen}
          registration={selectedRegistration}
          onClose={() =>
            setDrawerOpen(false)
          }
          onRefresh={fetchRegistrations}
          isFreeEntry={isFreeEntry}
          isWorkshop={isWorkshop}
        />

                {/* SMI Students */}

        <div className={styles.section}>
          <h2>SMI Students</h2>

          {smiStudents.length === 0 ? (
            <p className={styles.empty}>
              No SMI students registered.
            </p>
          ) : (
            smiStudents.map((registration, index) => (
              <div
                key={registration.id}
                className={`${styles.card} ${
                  selectedRegistration?.id ===
                  registration.id
                    ? styles.selected
                    : ""
                }`}
                onClick={() =>
                  openDrawer(registration)
                }
              >
                <div className={styles.left}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedIds.has(registration.id)}
                    onClick={(e) => toggleSelected(registration.id, e)}
                    onChange={() => {}}
                  />

                  <div className={styles.number}>
                    {index + 1}
                  </div>

                  <div>
                    <h3>
                      {registration.user?.fullName ?? registration.guestName}
                      {registration.isGuest && (
                        <span className={styles.guestTag}>Guest</span>
                      )}
                    </h3>

                    <p>{registration.user?.clubId ?? registration.guestRollNo}</p>

                    <p>{registration.user?.department ?? registration.guestDepartment}</p>

                    <p>{registration.user?.year ?? registration.guestYear}</p>

                    <p>{registration.user?.phoneNumber ?? registration.guestPhoneNumber}</p>

                    <p className={styles.registeredAt}>
                      Registered: {formatRegisteredAt(registration.createdAt)}
                    </p>
                  </div>
                </div>

                <div className={styles.right}>
                  <span
                    className={`${styles.badge} ${
                      styles[
                        registration.status
                          .toLowerCase()
                          .replace(/\s/g, "")
                      ] || ""
                    }`}
                  >
                    {registration.status}
                  </span>

                  {registration.status === "APPROVED" &&
                    !isFreeEntry &&
                    (() => {
                      const paymentBadge = getPaymentBadge({ ...registration, payments: [] });
                      return (
                        <>
                          <StatusBadge text={paymentBadge.text} tone={paymentBadge.tone} />

                          {paymentBadge.text === "Payment Pending" &&
                            registration.initialPaymentDeadline && (
                              <PaymentDeadlineCountdown
                                deadline={registration.initialPaymentDeadline}
                              />
                            )}
                        </>
                      );
                    })()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Other Institutions */}

        <div className={styles.section}>
          <h2>Other Institutions</h2>

          {otherStudents.length === 0 ? (
            <p className={styles.empty}>
              No students registered.
            </p>
          ) : (
            otherStudents.map(
              (registration, index) => (
                <div
                  key={registration.id}
                  className={`${styles.card} ${
                    selectedRegistration?.id ===
                    registration.id
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() =>
                    openDrawer(registration)
                  }
                >
                  <div
                    className={styles.left}
                  >
                    <div
                      className={
                        styles.number
                      }
                    >
                      {index + 1}
                    </div>

                    <div>
                      <h3>
                        {registration.user?.fullName ?? registration.guestName}
                        {registration.isGuest && (
                          <span className={styles.guestTag}>Guest</span>
                        )}
                      </h3>

                      <p>{registration.user?.clubId ?? registration.guestRollNo}</p>

                      <p>{registration.user?.institution ?? registration.guestInstitution}</p>

                      <p>{registration.user?.department ?? registration.guestDepartment}</p>

                      <p>{registration.user?.phoneNumber ?? registration.guestPhoneNumber}</p>

                      <p className={styles.registeredAt}>
                        Registered: {formatRegisteredAt(registration.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={styles.right}
                  >
                    <span
                      className={`${styles.badge} ${
                        styles[
                          registration.status
                            .toLowerCase()
                            .replace(/\s/g, "")
                        ] || ""
                      }`}
                    >
                      {
                        registration.status
                      }
                    </span>

                    {registration.status === "APPROVED" &&
                      !isFreeEntry &&
                      (() => {
                        const paymentBadge = getPaymentBadge({ ...registration, payments: [] });
                        return (
                          <>
                            <StatusBadge text={paymentBadge.text} tone={paymentBadge.tone} />

                            {paymentBadge.text === "Payment Pending" &&
                              registration.initialPaymentDeadline && (
                                <PaymentDeadlineCountdown
                                  deadline={registration.initialPaymentDeadline}
                                />
                              )}
                          </>
                        );
                      })()}
                  </div>
                </div>
              )
            )
          )}
        </div>
              </div>
    </>
  );
}