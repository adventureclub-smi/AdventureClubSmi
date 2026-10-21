"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Users } from "lucide-react";

import BackButton from "./shared/BackButton";
import styles from "./MemberDirectory.module.scss";

type Member = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  clubRole: string;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function MemberDirectory() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const timeout = setTimeout(async () => {
      setLoading(true);

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
  }, [query]);

  return (
    <div className={styles.container}>
      <BackButton />

      <div className={styles.header}>
        <span className={styles.eyebrow}>
          <Users size={14} /> MEMBERS ONLY
        </span>
        <h1>Member Directory</h1>
        <p>Find any NAVIRA member by name — just their name, photo, and club role.</p>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} />
        <input
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : members.length === 0 ? (
        <div className={styles.empty}>No members found.</div>
      ) : (
        <div className={styles.grid}>
          {members.map((member) => (
            <div key={member.id} className={styles.card}>
              <div className={styles.avatar}>
                {member.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt={member.fullName}
                    fill
                    sizes="56px"
                  />
                ) : (
                  <span>{initialsOf(member.fullName) || "N"}</span>
                )}
              </div>

              <div>
                <h3>{member.fullName}</h3>
                <span className={styles.roleBadge}>{member.clubRole}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
