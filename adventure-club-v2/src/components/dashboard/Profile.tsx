"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, LogOut, Mountain, Route, Sparkles } from "lucide-react";

import BackButton from "./shared/BackButton";
import StatCard from "./shared/StatCard";
import GovtIdVerification, { type GovtIdData } from "./GovtIdVerification";
import { getBadges, getPortfolioPoints, type PortfolioTotals } from "@/lib/portfolio";
import { getProfileCompletion } from "@/lib/profile-completion";
import {
  SMI,
  OTHER_DEPARTMENTS,
  SMI_UNDERGRAD_PROGRAMS,
  SMI_POSTGRAD_PROGRAMS,
  YEARS,
} from "@/lib/academic-options";
import styles from "./Profile.module.scss";

const KNOWN_INSTITUTIONS = [SMI, ...OTHER_DEPARTMENTS];
const SMI_PROGRAMS = [...SMI_UNDERGRAD_PROGRAMS, ...SMI_POSTGRAD_PROGRAMS, "PhD"];

type UserProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  upiId: string;
  upiPhone: string;
  institution: string;
  department: string;
  year: string;
  bloodGroup: string;
  dateOfBirth: string;
  collegeRollNumber: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  clubId: string;
  membershipStatus: string;
  clubRole: string;
} & GovtIdData;

const emptyProfile: UserProfile = {
  fullName: "",
  email: "",
  phoneNumber: "",
  upiId: "",
  upiPhone: "",
  institution: "",
  department: "",
  year: "",
  bloodGroup: "",
  dateOfBirth: "",
  collegeRollNumber: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  clubId: "",
  membershipStatus: "",
  clubRole: "",
  govtIdType: null,
  govtIdNumber: null,
  govtIdImageUrl: null,
  govtIdStatus: "NOT_SUBMITTED",
  govtIdLocked: false,
};

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(emptyProfile);
  const [portfolioTotals, setPortfolioTotals] = useState<PortfolioTotals>({
    totalTreks: 0,
    totalKm: 0,
    totalNights: 0,
    peaks: 0,
    highestAltitude: 0,
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!active) return;

        setUser({
          ...emptyProfile,
          ...data,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          upiId: data.upiId || "",
          upiPhone: data.upiPhone || "",
          phoneNumber: data.phoneNumber || "",
          bloodGroup: data.bloodGroup || "",
          collegeRollNumber: data.collegeRollNumber || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactRelation: data.emergencyContactRelation || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok || !active) return;
        setPortfolioTotals(await res.json());
      } catch (err) {
        console.error(err);
      }
    }

    loadProfile();
    loadStats();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      setStatus(res.ok ? "Profile updated successfully." : "Could not save changes.");
    } catch {
      setStatus("Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Reuses the same "forgot password" email flow rather than a separate
  // current-password form — the student is already authenticated, so we
  // already know their email and can skip straight to sending the link.
  async function handleChangePassword() {
    setSendingReset(true);
    setPasswordStatus(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json().catch(() => null);

      setPasswordStatus(
        data?.message || "Check your email for a link to reset your password."
      );
    } catch {
      setPasswordStatus("Could not send the reset link — please try again.");
    } finally {
      setSendingReset(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setUser({ ...user, [e.target.name]: e.target.value });
  }

  const isKnownInstitution = KNOWN_INSTITUTIONS.includes(user.institution);
  const institutionSelectValue = user.institution
    ? isKnownInstitution
      ? user.institution
      : "Other"
    : "";
  const isSMI = user.institution === SMI;

  function handleInstitutionSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    if (value === "Other") {
      // Keep whatever custom institution was already on file (if any) so
      // switching to "Other" and back doesn't wipe a value that was fine.
      setUser((prev) => ({
        ...prev,
        institution: isKnownInstitution ? "" : prev.institution,
        department: "",
      }));
      return;
    }

    setUser((prev) => ({ ...prev, institution: value, department: "" }));
  }

  function handleDepartmentSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUser((prev) => ({ ...prev, department: e.target.value }));
  }

  const {
    requiredFields,
    percent: completionPercent,
    isComplete: isProfileComplete,
  } = getProfileCompletion(user);

  const badges = getBadges(portfolioTotals);
  const points = getPortfolioPoints(portfolioTotals);
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) return <p className={styles.loading}>Loading profile...</p>;

  return (
    <div className={styles.container}>
      <BackButton />

      <motion.div
        className={styles.profileHeader}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.avatar}>{initials || "AC"}</div>

        <div className={styles.identity}>
          <h1>{user.fullName || "NAVIRA Member"}</h1>
          <p>{user.institution}</p>

          <div className={styles.chips}>
            <span className={styles.chip}>Club ID: {user.clubId}</span>
            <span className={styles.chipAccent}>{user.membershipStatus}</span>
            <span className={styles.chip}>{user.clubRole}</span>
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} className={styles.saveButton}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </motion.div>

      {status && <p className={styles.status}>{status}</p>}

      <motion.div
        className={styles.completionCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.completionHeader}>
          <div>
            <h3>Profile Completion</h3>
            <p>
              {isProfileComplete
                ? "Your profile is fully active."
                : "Your profile only becomes active once every field below is filled."}
            </p>
          </div>

          <span
            className={`${styles.completionPercent} ${
              isProfileComplete ? styles.completionPercentDone : ""
            }`}
          >
            {completionPercent}%
          </span>
        </div>

        <div className={styles.progressTrack}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {!isProfileComplete && (
          <div className={styles.missingFields}>
            {requiredFields
              .filter((f) => !f.filled)
              .map((f) => (
                <span key={f.label} className={styles.missingChip}>
                  {f.label}
                </span>
              ))}
          </div>
        )}
      </motion.div>

      <div className={styles.statsRow}>
        <StatCard icon={Mountain} value={portfolioTotals.totalTreks} label="Completed Treks" />
        <StatCard icon={Route} value={portfolioTotals.totalKm} suffix=" km" label="Total Distance" />
        <StatCard icon={Sparkles} value={points} label="Portfolio Points" />
        <StatCard icon={Award} value={badges.filter((b) => b.achieved).length} label="Badges Earned" />
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Personal Information</h2>

          <div className={styles.fields}>
            <div>
              <label>Full Name</label>
              <input name="fullName" value={user.fullName} onChange={handleChange} />
            </div>

            <div>
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={user.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Blood Group</label>
              <input
                name="bloodGroup"
                value={user.bloodGroup}
                onChange={handleChange}
                placeholder="O+, A+, B+, AB+..."
              />
            </div>

            <div>
              <label>College Roll Number</label>
              <input
                name="collegeRollNumber"
                value={user.collegeRollNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Contact Details</h2>

          <div className={styles.fields}>
            <div>
              <label>Email</label>
              <input value={user.email} disabled />
            </div>

            <div>
              <label>Phone Number</label>
              <input name="phoneNumber" value={user.phoneNumber} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Reimbursement Details</h2>

          <p className={styles.note}>
            These details will automatically be used for any reimbursement
            after a trek. You can update them anytime.
          </p>

          <div className={styles.fields}>
            <div>
              <label>UPI ID</label>
              <input
                name="upiId"
                value={user.upiId}
                onChange={handleChange}
                placeholder="example@oksbi"
              />
            </div>

            <div>
              <label>UPI Phone Number</label>
              <input
                name="upiPhone"
                value={user.upiPhone}
                onChange={handleChange}
                placeholder="9876543210"
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Academic Information</h2>

          <div className={styles.fields}>
            <div>
              <label>Institution</label>
              <select value={institutionSelectValue} onChange={handleInstitutionSelectChange}>
                <option value="" disabled>
                  Select institution
                </option>
                <option value={SMI}>{SMI}</option>
                <option disabled>──────────</option>
                {OTHER_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {!isKnownInstitution && (
              <div>
                <label>Institution (specify)</label>
                <input
                  name="institution"
                  value={user.institution}
                  onChange={handleChange}
                  placeholder="Enter your institution/department"
                />
              </div>
            )}

            <div>
              <label>Department</label>
              {isSMI ? (
                <select value={user.department} onChange={handleDepartmentSelectChange}>
                  <option value="" disabled>
                    Select program
                  </option>
                  {SMI_PROGRAMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={user.department} disabled />
              )}
            </div>

            <div>
              <label>Year</label>
              <select name="year" value={user.year} onChange={handleChange}>
                <option value="" disabled>
                  Select year
                </option>
                {YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Emergency Contact</h2>

          <div className={styles.fields}>
            <div>
              <label>Name</label>
              <input
                name="emergencyContactName"
                value={user.emergencyContactName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Relationship</label>
              <input
                name="emergencyContactRelation"
                value={user.emergencyContactRelation}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Phone Number</label>
              <input
                name="emergencyContactPhone"
                value={user.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2>Club Information</h2>

          <div className={styles.fields}>
            <div>
              <label>Club ID</label>
              <input value={user.clubId} disabled />
            </div>

            <div>
              <label>Status</label>
              <input value={user.membershipStatus} disabled />
            </div>

            <div>
              <label>Club Role</label>
              <input value={user.clubRole} disabled />
            </div>
          </div>

          <small className={styles.note}>
            These details can only be updated by the club administration.
          </small>
        </section>

        <GovtIdVerification
          data={{
            govtIdType: user.govtIdType,
            govtIdNumber: user.govtIdNumber,
            govtIdImageUrl: user.govtIdImageUrl,
            govtIdStatus: user.govtIdStatus,
            govtIdLocked: user.govtIdLocked,
          }}
          onUpdated={(govtId) => setUser((prev) => ({ ...prev, ...govtId }))}
        />

        <section className={styles.card}>
          <h2>Achievements</h2>

          <div className={styles.badgeGrid}>
            {badges.map((badge) => (
              <span
                key={badge.id}
                className={badge.achieved ? styles.badgeEarned : styles.badgeLocked}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2>Settings</h2>

          <p className={styles.passwordText}>
            {passwordStatus || "We'll email you a link to reset your password, same as \"Forgot Password\" on the login page."}
          </p>

          <div className={styles.settingsActions}>
            <button
              className={styles.passwordButton}
              type="button"
              onClick={handleChangePassword}
              disabled={sendingReset}
            >
              {sendingReset ? "Sending..." : "Change Password"}
            </button>

            <button className={styles.logoutButton} type="button" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
