"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Unlock, ExternalLink, Mail, MessageCircle } from "lucide-react";
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

// Club IDs are "AC{yearCode}-{number}" (e.g. "AC26-0001") — the prefix marks
// which signup year a student belongs to, so only the number after the dash
// is ever meant to move (e.g. fixing a typo or resolving a duplicate).
function splitClubId(clubId: string) {
  const dashIndex = clubId.lastIndexOf("-");

  if (dashIndex === -1) return { prefix: "", suffix: clubId };

  return { prefix: clubId.slice(0, dashIndex + 1), suffix: clubId.slice(dashIndex + 1) };
}

type Member = {
  fullName: string;
  clubId: string;
  email: string;
  phoneNumber: string;
  institution: string;
  department: string;
  course: string | null;
  year: string;
  membershipStatus: string;
  clubRole: string;
  adminAccessLevel: string;
  bloodGroup: string | null;
  dateOfBirth: string | null;
  collegeRollNumber: string | null;
  upiId: string | null;
  upiPhone: string | null;
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

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// wa.me needs a country code with no leading "+"/"0" — every stored number
// is a plain 10-digit Indian mobile, so a bare 10-digit value gets "91"
// prepended; anything already longer is left alone rather than guessed at.
function whatsappLink(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

export default function MemberProfile({
  userId,
  canEditAccess,
}: {
  userId: string;
  canEditAccess: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<Member | null>(null);
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [clubIdSuffix, setClubIdSuffix] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/members/${userId}`);
        if (!res.ok || !active) return;

        const data: Member = await res.json();
        setUser(data);
        setClubIdSuffix(splitClubId(data.clubId).suffix);
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

    const clubIdPrefix = splitClubId(user.clubId).prefix;

    const res = await fetch(`/api/admin/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipStatus: user.membershipStatus,
        clubRole: user.clubRole,
        adminAccessLevel: user.adminAccessLevel,
        clubId: `${clubIdPrefix}${clubIdSuffix.trim()}`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Failed to save changes.");
      return;
    }

    setUser({ ...user, clubId: data.clubId });
    setClubIdSuffix(splitClubId(data.clubId).suffix);
    setStatus("Changes saved.");
  }

  async function approve() {
    if (!user) return;

    await fetch(`/api/admin/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipStatus: "ACTIVE",
        clubRole: "Member",
      }),
    });

    setUser({ ...user, membershipStatus: "ACTIVE", clubRole: "Member" });
    setStatus("Member approved.");
  }

  async function undoApproval() {
    if (!user) return;

    await fetch(`/api/admin/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipStatus: "PENDING",
        clubRole: user.clubRole,
      }),
    });

    setUser({ ...user, membershipStatus: "PENDING" });
    setStatus("Approval undone — back to pending.");
  }

  async function deleteStudent() {
    if (!user) return;

    const confirmDelete = confirm(
      `Delete ${user.fullName} (${user.clubId})? This permanently removes their account, registrations, payments and certificates. This cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/members/${userId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete student.");
        setDeleting(false);
        return;
      }

      router.push("/admin/members");
    } catch (error) {
      console.error(error);
      alert("Failed to delete student.");
      setDeleting(false);
    }
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
          <>
            <button
              className={styles.deleteButton}
              onClick={deleteStudent}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Student"}
            </button>

            <button className={styles.saveButton} onClick={save}>
              Save Changes
            </button>
          </>
        }
      />

      {status && <p className={styles.status}>{status}</p>}

      {user.membershipStatus === "PENDING" && (
        <div className={styles.pendingBanner}>
          <div>
            <strong>New sign-up awaiting approval</strong>
            <p>Review the details below, then approve to activate their membership.</p>
          </div>
          <button className={styles.approveButton} onClick={approve}>
            Approve Member
          </button>
        </div>
      )}

      {user.membershipStatus === "ACTIVE" && (
        <div className={styles.approvedBanner}>
          <div>
            <strong>Member Approved</strong>
            <p>This student is an active member. Undo if this was approved by mistake.</p>
          </div>
          <button className={styles.undoApprovalButton} onClick={undoApproval}>
            Undo Approval
          </button>
        </div>
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Personal Information</h2>

          <p>
            <strong>Name:</strong> {user.fullName}
          </p>
          <p>
            <strong>Date of Birth:</strong> {formatDate(user.dateOfBirth)}
          </p>
          <p>
            <strong>Blood Group:</strong> {user.bloodGroup || "-"}
          </p>
          <p>
            <strong>College Roll Number:</strong> {user.collegeRollNumber || "-"}
          </p>
        </section>

        <section className={styles.card}>
          <h2>Contact Details</h2>

          <p>
            <strong>Email:</strong> {user.email}
            <a
              href={`mailto:${user.email}`}
              className={styles.contactIcon}
              title="Send email"
              aria-label="Send email"
            >
              <Mail size={14} />
            </a>
          </p>
          <p>
            <strong>Phone:</strong> {user.phoneNumber}
            <a
              href={whatsappLink(user.phoneNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactIconWhatsapp}
              title="Message on WhatsApp"
              aria-label="Message on WhatsApp"
            >
              <MessageCircle size={14} />
            </a>
          </p>
        </section>

        <section className={styles.card}>
          <h2>Reimbursement Details</h2>

          <p>
            <strong>UPI ID:</strong> {user.upiId || "-"}
          </p>
          <p>
            <strong>UPI Phone Number:</strong> {user.upiPhone || "-"}
          </p>
        </section>

        <section className={styles.card}>
          <h2>Academic Information</h2>

          <p>
            <strong>Institution:</strong> {user.institution}
          </p>
          <p>
            <strong>Department:</strong> {user.department}
          </p>
          <p>
            <strong>Course:</strong> {user.course || "-"}
          </p>
          <p>
            <strong>Year:</strong> {user.year}
          </p>
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
          <h2>Club Information</h2>

          <div className={styles.clubIdField}>
            <label>Club ID</label>

            <div className={styles.clubIdEditor}>
              <span>{splitClubId(user.clubId).prefix}</span>

              <input
                type="text"
                value={clubIdSuffix}
                onChange={(e) => setClubIdSuffix(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fields}>
            <div>
              <label>Status</label>

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
                <option>Pending</option>
                <option>Admin</option>
                <option>President</option>
                <option>Treasurer</option>
                <option>Member</option>
                <option>Registered Member</option>
                <option>Participant</option>
                <option>Guides</option>
                <option>Logistics Head</option>
                <option>Logistics Team</option>
                <option>Event Head</option>
                <option>Event Team</option>
                <option>Visual Team Head</option>
                <option>Visual Team</option>
                <option>Marketing Head</option>
                <option>Marketing Team</option>
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
                  Only Admin, President, or Treasurer can edit this.
                </p>
              )}
            </div>
          </div>
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
