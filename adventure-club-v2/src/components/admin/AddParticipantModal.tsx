"use client";

import { useEffect, useState } from "react";
import styles from "./AddParticipantModal.module.scss";

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
  trekId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddParticipantModal({
  trekId,
  open,
  onClose,
  onAdded,
}: Props) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setMembers([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchMembers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  async function searchMembers() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/members/search?query=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      setMembers(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  async function addMember(userId: string) {
    setAdding(userId);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trekId,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setAdding("");
        return;
      }

      alert("Participant added successfully!");

      onAdded();

      onClose();

      setQuery("");

      setMembers([]);
    } catch (error) {
      console.error(error);

      alert("Something went wrong.");
    }

    setAdding("");
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Add Participant</h2>

          <button onClick={onClose}>
            ✕
          </button>
        </div>

        <input
          className={styles.search}
          placeholder="Search by Name / Club ID / Phone"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

        {loading && (
          <p className={styles.message}>
            Searching...
          </p>
        )}

        {!loading &&
          members.length === 0 &&
          query && (
            <p className={styles.message}>
              No members found.
            </p>
          )}

        <div className={styles.results}>
          {members.map((member) => (
            <div
              key={member.id}
              className={styles.member}
            >
              <div>
                <h3>{member.fullName}</h3>

                <p>{member.clubId}</p>

                <p>
                  {member.institution} •{" "}
                  {member.department}
                </p>

                <p>{member.phoneNumber}</p>
              </div>

              <button
                disabled={adding === member.id}
                onClick={() =>
                  addMember(member.id)
                }
              >
                {adding === member.id
                  ? "Adding..."
                  : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}