"use client";

import { useEffect, useState } from "react";
import styles from "./LinkAccountModal.module.scss";

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
  registrationId: string | null;
  guestName: string;
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
};

export default function LinkAccountModal({
  registrationId,
  guestName,
  open,
  onClose,
  onLinked,
}: Props) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState("");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const trimmed = query.trim();

      if (!trimmed) {
        setMembers([]);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(`/admin/members/search?query=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleClose() {
    setQuery("");
    setMembers([]);
    onClose();
  }

  async function linkMember(userId: string) {
    if (!registrationId) return;

    setLinking(userId);

    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}/link-account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setLinking("");
        return;
      }

      onLinked();
      handleClose();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLinking("");
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Link to Account</h2>

          <button onClick={handleClose}>✕</button>
        </div>

        <p className={styles.subtitle}>
          Find the real account for &ldquo;{guestName}&rdquo; — once linked, this trek record
          will show up in that student&apos;s own dashboard.
        </p>

        <input
          className={styles.search}
          placeholder="Search by Name / Club ID / Phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

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

              <button disabled={linking === member.id} onClick={() => linkMember(member.id)}>
                {linking === member.id ? "Linking..." : "Link"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
