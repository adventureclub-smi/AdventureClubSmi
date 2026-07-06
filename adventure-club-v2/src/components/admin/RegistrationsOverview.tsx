"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import StatusBadge, { type StatusTone } from "@/components/dashboard/shared/StatusBadge";
import styles from "./RegistrationsOverview.module.scss";

type Registration = {
  id: string;
  registrationNumber: string;
  participant: string;
  clubId: string;
  trekId: string;
  trekTitle: string;
  status: string;
  createdAt: string;
};

const toneByStatus: Record<string, StatusTone> = {
  WAITING: "waiting",
  APPROVED: "approved",
  WAITLIST: "waitlist",
  REJECTED: "rejected",
  COMPLETED: "completed",
  MISSED: "danger",
};

export default function RegistrationsOverview() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/registrations");
        if (!res.ok || !active) return;
        setRegistrations(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return registrations.filter(
      (r) =>
        r.participant.toLowerCase().includes(q) ||
        r.clubId.toLowerCase().includes(q) ||
        r.trekTitle.toLowerCase().includes(q)
    );
  }, [registrations, search]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Registrations"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Registrations" }]}
        quickActions={
          <div className={styles.searchWrap}>
            <Search size={15} />
            <input
              placeholder="Search participant, club ID, or trek..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No registrations found.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Club ID</th>
                <th>Trek</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.participant}</strong>
                  </td>
                  <td>{r.clubId}</td>
                  <td>{r.trekTitle}</td>
                  <td>
                    <StatusBadge text={r.status} tone={toneByStatus[r.status] || "neutral"} />
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/treks/${r.trekId}/registrations`}>Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
