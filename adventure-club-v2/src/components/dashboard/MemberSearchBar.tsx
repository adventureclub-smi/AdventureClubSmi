"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

import MemberProfileModal from "./MemberProfileModal";
import styles from "./MemberSearchBar.module.scss";

type Member = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  clubRole: string;
  trekCount: number;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Members-only quick lookup, members by name — just enough to recognize
// someone (name, photo, club role, how many treks they've shown up to).
// Replaces the old dedicated /dashboard/directory page: it lives at the top
// of the dashboard instead, open by default on focus so it still doubles as
// "who are the club's most active members" even before you type anything.
export default function MemberSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/directory?query=${encodeURIComponent(query)}`);
        if (!res.ok || !active) return;
        setMembers(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.searchBar}>
        <Search size={18} />
        <input
          placeholder="Find a member by name..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>

      {open && (
        <div className={styles.dropdown}>
          <span className={styles.dropdownLabel}>
            {query ? "Search results" : "Most active members"}
          </span>

          {loading ? (
            <p className={styles.hint}>Loading...</p>
          ) : members.length === 0 ? (
            <p className={styles.hint}>No members found.</p>
          ) : (
            <div className={styles.list}>
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setOpen(false);
                  }}
                >
                  <div className={styles.avatar}>
                    {member.avatarUrl ? (
                      <Image src={member.avatarUrl} alt={member.fullName} fill sizes="40px" />
                    ) : (
                      <span>{initialsOf(member.fullName) || "N"}</span>
                    )}
                  </div>

                  <div className={styles.info}>
                    <h4>{member.fullName}</h4>
                    <span className={styles.roleBadge}>{member.clubRole}</span>
                  </div>

                  <span className={styles.trekCount}>
                    {member.trekCount} {member.trekCount === 1 ? "trek" : "treks"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <MemberProfileModal
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
}
