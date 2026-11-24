"use client";

import { useEffect, useState } from "react";
import { SMI, OTHER_DEPARTMENTS, YEARS, FACULTY, GENDERS } from "@/lib/academic-options";
import styles from "../AddParticipantModal.module.scss";

type Member = {
  id: string;
  clubId: string;
  fullName: string;
  phoneNumber: string;
  institution: string;
  department: string;
  year: string;
};

type Props = {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

// Same search-and-add pattern as AddParticipantModal (treks), just posting
// to EventRegistration instead of Registration.
export default function AddEventParticipantModal({ eventId, open, onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState("");
  const [memberGender, setMemberGender] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestRollNo, setGuestRollNo] = useState("");
  const [guestDepartment, setGuestDepartment] = useState("");
  const [guestDepartmentOther, setGuestDepartmentOther] = useState("");
  const [guestYear, setGuestYear] = useState("");
  const [guestGender, setGuestGender] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setMembers([]);
      return;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/members/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (active) setMembers(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  async function addMember(userId: string) {
    if (!memberGender) {
      alert("Pick their gender first.");
      return;
    }

    setAdding(userId);

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gender: memberGender }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setAdding("");
        return;
      }

      alert(data.message || "Participant added successfully!");

      onAdded();
      onClose();
      setQuery("");
      setMembers([]);
      setMemberGender("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setAdding("");
  }

  async function addGuest() {
    const finalDepartment =
      guestDepartment === "Other" ? guestDepartmentOther.trim() : guestDepartment;

    if (
      !guestName.trim() ||
      !guestPhone.trim() ||
      !guestRollNo.trim() ||
      !finalDepartment ||
      !guestYear.trim() ||
      !guestGender.trim()
    ) {
      alert("Name, phone, college ID, department, year and gender are required.");
      return;
    }

    setAddingGuest(true);

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest: {
            name: guestName,
            phone: guestPhone,
            rollNo: guestRollNo,
            department: finalDepartment,
            year: guestYear,
          },
          gender: guestGender,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setAddingGuest(false);
        return;
      }

      alert(data.message || "Guest added successfully!");

      onAdded();
      onClose();
      setGuestName("");
      setGuestPhone("");
      setGuestRollNo("");
      setGuestDepartment("");
      setGuestDepartmentOther("");
      setGuestYear("");
      setGuestGender("");
      setGuestMode(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setAddingGuest(false);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Add Participant</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setGuestMode(false)}
            style={{ fontWeight: guestMode ? 400 : 700 }}
          >
            Club member
          </button>
          <button
            type="button"
            onClick={() => setGuestMode(true)}
            style={{ fontWeight: guestMode ? 700 : 400 }}
          >
            Guest (no club account)
          </button>
        </div>

        {guestMode ? (
          <div className={styles.results} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className={styles.search}
              placeholder="Full name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
            <input
              className={styles.search}
              placeholder="Phone number"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
            <input
              className={styles.search}
              placeholder="College ID"
              value={guestRollNo}
              onChange={(e) => setGuestRollNo(e.target.value)}
            />
            <select
              className={styles.search}
              value={guestDepartment}
              onChange={(e) => {
                setGuestDepartment(e.target.value);
                setGuestDepartmentOther("");
              }}
            >
              <option value="" disabled>
                Department
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
            {guestDepartment === "Other" && (
              <input
                className={styles.search}
                placeholder="Enter department"
                value={guestDepartmentOther}
                onChange={(e) => setGuestDepartmentOther(e.target.value)}
              />
            )}
            <select
              className={styles.search}
              value={guestYear}
              onChange={(e) => setGuestYear(e.target.value)}
            >
              <option value="" disabled>
                Year
              </option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value={FACULTY}>{FACULTY}</option>
            </select>
            <select
              className={styles.search}
              value={guestGender}
              onChange={(e) => setGuestGender(e.target.value)}
            >
              <option value="" disabled>
                Gender
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button disabled={addingGuest} onClick={addGuest}>
              {addingGuest ? "Adding..." : "Add Guest"}
            </button>
          </div>
        ) : (
          <>
            <input
              className={styles.search}
              placeholder="Search by Name / Club ID / Phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className={styles.search}
              value={memberGender}
              onChange={(e) => setMemberGender(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <option value="" disabled>
                Their gender (required before adding)
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {loading && <p className={styles.message}>Searching...</p>}

            {!loading && members.length === 0 && query && (
              <p className={styles.message}>No members found.</p>
            )}

            <div className={styles.results}>
              {members.map((member) => (
                <div key={member.id} className={styles.member}>
                  <div>
                    <h3>{member.fullName}</h3>
                    <p>{member.clubId}</p>
                    <p>
                      {member.institution} • {member.department}
                    </p>
                    <p>{member.phoneNumber}</p>
                  </div>

                  <button disabled={adding === member.id} onClick={() => addMember(member.id)}>
                    {adding === member.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
