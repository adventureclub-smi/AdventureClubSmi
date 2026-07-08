"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Unlock, ExternalLink } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./MemberProfile.module.scss";

type Registration = { id: string; status: string; trek: { title: string } };

const ID_TYPE_LABELS: Record<string, string> = {
  PAN: "PAN Card",
  VOTER_ID: "Voter ID",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
};

type Member = {
  fullName: string;
  clubId: string;
  email: string;
  phoneNumber: string;
  department: string;
  year: string;
  membershipStatus: string;
  clubRole: string;
  adminAccessLevel: string;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  registrations: Registration[];
  govtIdType: string | null;
  govtIdNumber: string | null;
  govtIdImageUrl: string | null;
  govtIdStatus: string;
  govtIdLocked: boolean;
};

export default function MemberProfile({
  userId,
  canEditAccess,
}: {
  userId: string;
  canEditAccess: boolean;
}) {
  const [user, setUser] = useState<Member | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/members/${userId}`);
        if (!res.ok || !active) return;
        setUser(await res.json());
      } catch {
        // non-critical
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  async function save() {
    if (!user) return;

    await fetch(`/api/admin/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipStatus: user.membershipStatus,
        clubRole: user.clubRole,
        adminAccessLevel: user.adminAccessLevel,
      }),
    });

    setStatus("Changes saved.");
  }

  async function toggleGovtVerified() {
    if (!user) return;

    const nextStatus = user.govtIdStatus === "VERIFIED" ? "PENDING" : "VERIFIED";

    const res = await fetch(`/api/admin/members/${userId}/govt-id`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ govtIdStatus: nextStatus }),
    });

    if (res.ok) setUser({ ...user, govtIdStatus: nextStatus });
  }

  async function toggleGovtLocked() {
    if (!user) return;

    const nextLocked = !user.govtIdLocked;

    const res = await fetch(`/api/admin/members/${userId}/govt-id`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ govtIdLocked: nextLocked }),
    });

    if (res.ok) setUser({ ...user, govtIdLocked: nextLocked });
  }

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={user.fullName}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Students", href: "/admin/members" },
          { label: user.fullName },
        ]}
        quickActions={
          <button className={styles.saveButton} onClick={save}>
            Save Changes
          </button>
        }
      />

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Personal Information</h2>

          <p>
            <strong>Name:</strong> {user.fullName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Phone:</strong> {user.phoneNumber}
          </p>
          <p>
            <strong>Department:</strong> {user.department}
          </p>
          <p>
            <strong>Year:</strong> {user.year}
          </p>
          <p>
            <strong>Club ID:</strong> {user.clubId}
          </p>
        </section>

        <section className={styles.card}>
          <h2>Membership</h2>

          <div className={styles.fields}>
            <div>
              <label>Membership Status</label>

              <select
                value={user.membershipStatus}
                onChange={(e) => setUser({ ...user, membershipStatus: e.target.value })}
              >
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label>Club Role</label>

              <select
                value={user.clubRole}
                onChange={(e) => setUser({ ...user, clubRole: e.target.value })}
              >
                <option>President</option>
                <option>Treasurer</option>
                <option>Member</option>
                <option>Participant</option>
                <option>Guides</option>
                <option>Logistics Head</option>
                <option>Logistics Team</option>
                <option>Event Head</option>
                <option>Event Team</option>
                <option>Visual Team Head</option>
                <option>Visual Team</option>
                <option>Marketing Head</option>
                <option>Web & Tech Team</option>
              </select>
            </div>

            <div>
              <label>Access</label>

              <select
                value={user.adminAccessLevel}
                disabled={!canEditAccess}
                onChange={(e) => setUser({ ...user, adminAccessLevel: e.target.value })}
              >
                <option value="NONE">No Admin Access</option>
                <option value="FULL">Full Admin Access</option>
                <option value="FINANCE">Only Finance Access</option>
                <option value="VISUAL">Visual Access</option>
                <option value="BOOKING">Booking Access</option>
              </select>

              {!canEditAccess && (
                <p className={styles.accessNote}>
                  Only the President or Treasurer can edit this.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Emergency Contact</h2>

          <p>
            <strong>Name:</strong> {user.emergencyContactName || "-"}
          </p>
          <p>
            <strong>Relationship:</strong> {user.emergencyContactRelation || "-"}
          </p>
          <p>
            <strong>Phone:</strong> {user.emergencyContactPhone || "-"}
          </p>
        </section>

        <section className={styles.card}>
          <h2>
            <ShieldCheck size={17} /> Government ID Verification
          </h2>

          <div className={styles.govtStatusRow}>
            {user.govtIdLocked ? (
              <StatusBadge text="Verified & Locked" tone="success" />
            ) : user.govtIdStatus === "VERIFIED" ? (
              <StatusBadge text="Verified" tone="success" />
            ) : user.govtIdStatus === "PENDING" ? (
              <StatusBadge text="Pending Review" tone="waiting" />
            ) : (
              <StatusBadge text="Not Submitted" tone="neutral" />
            )}
          </div>

          {user.govtIdType ? (
            <>
              <p>
                <strong>ID Type:</strong> {ID_TYPE_LABELS[user.govtIdType] || user.govtIdType}
              </p>
              <p>
                <strong>ID Number:</strong> {user.govtIdNumber}
              </p>

              {user.govtIdImageUrl && (
                <a
                  href={user.govtIdImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewDocLink}
                >
                  <ExternalLink size={14} /> View uploaded document
                </a>
              )}

              <div className={styles.govtActions}>
                <button className={styles.verifyButton} onClick={toggleGovtVerified}>
                  {user.govtIdStatus === "VERIFIED" ? "Undo Verification" : "Verified"}
                </button>

                <button className={styles.lockButton} onClick={toggleGovtLocked}>
                  {user.govtIdLocked ? (
                    <>
                      <Unlock size={14} /> Unlock
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Lock
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <p>Student hasn&apos;t submitted a government ID yet.</p>
          )}
        </section>

        <section className={styles.card}>
          <h2>Trek History</h2>

          {user.registrations.length === 0 ? (
            <p>No treks yet.</p>
          ) : (
            user.registrations.map((registration) => (
              <div key={registration.id} className={styles.trekRow}>
                <strong>{registration.trek.title}</strong>
                <p>Status: {registration.status}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
