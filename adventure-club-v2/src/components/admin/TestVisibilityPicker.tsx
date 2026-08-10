"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import styles from "./TestVisibilityPicker.module.scss";

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
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function TestVisibilityPicker({ selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [knownMembers, setKnownMembers] = useState<Record<string, Member>>({});

  // Backfills display info for IDs the trek already had selected before this
  // component mounted (e.g. opening the edit form) — the trek record only
  // stores raw user IDs, not names, so those chips need one lookup each the
  // first time they show up.
  useEffect(() => {
    const missing = selectedIds.filter((id) => !knownMembers[id]);

    if (missing.length === 0) return;

    let active = true;

    Promise.all(
      missing.map((id) =>
        fetch(`/api/admin/members/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((members) => {
      if (!active) return;

      setKnownMembers((prev) => {
        const next = { ...prev };
        members.forEach((member) => {
          if (member?.id) next[member.id] = member;
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/admin/members/search?query=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setResults(data);

          setKnownMembers((prev) => {
            const next = { ...prev };
            data.forEach((member: Member) => {
              next[member.id] = member;
            });
            return next;
          });
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className={styles.picker}>
      {selectedIds.length > 0 && (
        <div className={styles.chips}>
          {selectedIds.map((id) => (
            <span key={id} className={styles.chip}>
              {knownMembers[id]?.fullName || "Loading..."}
              <button type="button" onClick={() => toggle(id)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        className={styles.search}
        placeholder="Search by Name / Club ID / Phone to add a student"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className={styles.message}>Searching...</p>}

      {!loading && query && results.length === 0 && (
        <p className={styles.message}>No members found.</p>
      )}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((member) => {
            const selected = selectedIds.includes(member.id);

            return (
              <div key={member.id} className={styles.member}>
                <div>
                  <h4>{member.fullName}</h4>
                  <p>
                    {member.clubId} • {member.institution}
                  </p>
                </div>

                <button
                  type="button"
                  className={selected ? styles.remove : styles.add}
                  onClick={() => toggle(member.id)}
                >
                  {selected ? "Remove" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
