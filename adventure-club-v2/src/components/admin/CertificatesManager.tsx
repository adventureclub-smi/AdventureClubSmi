"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, ArrowRight, CheckCircle2, Clock } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CertificatesManager.module.scss";

type Candidate = { id: string; trekId: string; trekTitle: string };
type Issued = { id: string; trekId: string; trekTitle: string };

type TrekGroup = {
  trekId: string;
  trekTitle: string;
  readyCount: number;
  issuedCount: number;
};

function groupByTrek(candidates: Candidate[], issued: Issued[]): TrekGroup[] {
  const groups = new Map<string, TrekGroup>();

  function ensure(trekId: string, trekTitle: string) {
    const existing = groups.get(trekId);
    if (existing) return existing;

    const created: TrekGroup = { trekId, trekTitle, readyCount: 0, issuedCount: 0 };
    groups.set(trekId, created);
    return created;
  }

  candidates.forEach((c) => ensure(c.trekId, c.trekTitle).readyCount++);
  issued.forEach((i) => ensure(i.trekId, i.trekTitle).issuedCount++);

  // Treks with something still to issue float to the top — that's the
  // actionable queue, not the ones that are already fully done.
  return Array.from(groups.values()).sort((a, b) => {
    if (a.readyCount !== b.readyCount) return b.readyCount - a.readyCount;
    return a.trekTitle.localeCompare(b.trekTitle);
  });
}

export default function CertificatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/certificates");
        if (!active || !res.ok) return;
        const data = await res.json();
        setCandidates(data.candidates);
        setIssued(data.issued);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const trekGroups = useMemo(() => groupByTrek(candidates, issued), [candidates, issued]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Certificates"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Certificates" }]}
      />

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : trekGroups.length === 0 ? (
        <div className={styles.empty}>No completed treks awaiting certificates right now.</div>
      ) : (
        <div className={styles.cardGrid}>
          {trekGroups.map((group) => (
            <Link
              key={group.trekId}
              href={`/admin/treks/${group.trekId}/certificates`}
              className={styles.trekCard}
            >
              <h2>
                <Award size={18} /> {group.trekTitle}
              </h2>

              <div className={styles.cardStats}>
                <span className={group.readyCount > 0 ? styles.statReady : styles.statMuted}>
                  <Clock size={14} /> {group.readyCount} Ready to Issue
                </span>

                <span className={styles.statMuted}>
                  <CheckCircle2 size={14} /> {group.issuedCount} Issued
                </span>
              </div>

              <span className={styles.cardLink}>
                Manage <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
