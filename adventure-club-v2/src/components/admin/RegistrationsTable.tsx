"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./RegistrationsTable.module.scss";
import AddParticipantModal from "./AddParticipantModal";
import RegistrationDrawer from "./RegistrationDrawer";
import { isSmiInstitution } from "@/lib/institution";

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

  type RegistrationMode = "auto" | "open" | "closed";

  const [registrationMode, setRegistrationModeState] =
    useState<RegistrationMode>("auto");

  const [togglingStatus, setTogglingStatus] = useState(false);

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
          : "auto"
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function setRegistrationMode(mode: RegistrationMode) {
    if (mode === registrationMode) return;

    setTogglingStatus(true);

    try {
      const action = mode === "open" ? "open" : mode === "closed" ? "close" : "auto";

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

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const value = search.toLowerCase();

      return (
        registration.user.fullName
          .toLowerCase()
          .includes(value) ||
        registration.user.clubId
          .toLowerCase()
          .includes(value) ||
        registration.user.phoneNumber.includes(value)
      );
    });
  }, [registrations, search]);

  const smiStudents = filtered.filter((r) =>
    isSmiInstitution(r.user.institution)
  );

  const otherStudents = filtered.filter(
    (r) => !isSmiInstitution(r.user.institution)
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
            </div>

            <button
              className={styles.addButton}
              onClick={() =>
                setShowAddParticipant(true)
              }
            >
              + Add Participant
            </button>
          </div>
        </div>

        <input
          className={styles.search}
          placeholder="Search by Name / Club ID / Phone"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

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
                  <div className={styles.number}>
                    {index + 1}
                  </div>

                  <div>
                    <h3>
                      {
                        registration.user
                          .fullName
                      }
                    </h3>

                    <p>
                      {
                        registration.user
                          .clubId
                      }
                    </p>

                    <p>
                      {
                        registration.user
                          .department
                      }
                    </p>

                    <p>
                      {
                        registration.user
                          .year
                      }
                    </p>

                    <p>
                      {
                        registration.user
                          .phoneNumber
                      }
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
                        {
                          registration.user
                            .fullName
                        }
                      </h3>

                      <p>
                        {
                          registration.user
                            .clubId
                        }
                      </p>

                      <p>
                        {
                          registration.user
                            .institution
                        }
                      </p>

                      <p>
                        {
                          registration.user
                            .department
                        }
                      </p>

                      <p>
                        {
                          registration.user
                            .phoneNumber
                        }
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