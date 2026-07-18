"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./MembersTable.module.scss";

interface Member {
  id: string;
  clubId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  year: string;
  department: string;
  membershipStatus: string;
  clubRole: string;
  govtIdStatus: string;
  govtIdLocked: boolean;
}

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function MembersTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [govtIdFilter, setGovtIdFilter] = useState("");
  const [sortBy, setSortBy] = useState<"clubId" | "nameAsc" | "nameDesc">("clubId");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/members");
        if (!res.ok || !active) return;
        setMembers(await res.json());
      } catch {
        // non-critical
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  function govtIdState(member: Member) {
    if (member.govtIdLocked) return "LOCKED";
    return member.govtIdStatus;
  }

  const filtered = useMemo(() => {
    const bySearch = members.filter((member) =>
      `${member.fullName} ${member.clubId} ${member.department}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const byYear = yearFilter
      ? bySearch.filter((member) => member.year === yearFilter)
      : bySearch;

    const byStatus = statusFilter
      ? byYear.filter((member) => member.membershipStatus === statusFilter)
      : byYear;

    const byGovtId = govtIdFilter
      ? byStatus.filter((member) => govtIdState(member) === govtIdFilter)
      : byStatus;

    const sorted = [...byGovtId].sort((a, b) => {
      if (sortBy === "nameAsc") return a.fullName.localeCompare(b.fullName);
      if (sortBy === "nameDesc") return b.fullName.localeCompare(a.fullName);
      return a.clubId.localeCompare(b.clubId);
    });

    return sorted;
  }, [members, search, yearFilter, statusFilter, govtIdFilter, sortBy]);

  async function setMembership(id: string, membershipStatus: string, clubRole?: string) {
    await fetch(`/api/admin/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipStatus,
        ...(clubRole ? { clubRole } : {}),
      }),
    });

    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? { ...member, membershipStatus, ...(clubRole ? { clubRole } : {}) }
          : member
      )
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Students"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Students" }]}
        quickActions={
          <div className={styles.searchWrap}>
            <Search size={15} />
            <input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className={styles.filterBar}>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select value={govtIdFilter} onChange={(e) => setGovtIdFilter(e.target.value)}>
          <option value="">Any Govt ID Status</option>
          <option value="NOT_SUBMITTED">Not Submitted</option>
          <option value="PENDING">Pending Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="LOCKED">Verified &amp; Locked</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "clubId" | "nameAsc" | "nameDesc")}
        >
          <option value="clubId">Sort: Club ID</option>
          <option value="nameAsc">Sort: Name (A-Z)</option>
          <option value="nameDesc">Sort: Name (Z-A)</option>
        </select>

        <span className={styles.resultCount}>{filtered.length} students</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Club ID</th>
              <th>Name</th>
              <th>Year</th>
              <th>Department</th>
              <th>Status</th>
              <th>Role</th>
              <th>Govt ID</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((member) => (
              <tr key={member.id}>
                <td>{member.clubId}</td>

                <td>
                  <strong>{member.fullName}</strong>
                  <p>{member.email}</p>
                </td>

                <td>{member.year}</td>
                <td>{member.department}</td>

                <td>
                  <span
                    className={
                      member.membershipStatus === "ACTIVE" ? styles.active : styles.pending
                    }
                  >
                    {member.membershipStatus}
                  </span>
                </td>

                <td>{member.clubRole}</td>

                <td>
                  {member.govtIdLocked ? (
                    <StatusBadge text="Verified & Locked" tone="success" />
                  ) : member.govtIdStatus === "VERIFIED" ? (
                    <StatusBadge text="Verified" tone="success" />
                  ) : member.govtIdStatus === "PENDING" ? (
                    <StatusBadge text="Pending Review" tone="waiting" />
                  ) : (
                    <StatusBadge text="Not Submitted" tone="neutral" />
                  )}
                </td>

                <td>
                  <div className={styles.rowActions}>
                    <Link href={`/admin/members/${member.id}`}>
                      <button className={styles.viewButton}>
                        {member.membershipStatus === "PENDING" ? "View & Approve" : "Manage"}
                      </button>
                    </Link>

                    {member.membershipStatus === "PENDING" && (
                      <button onClick={() => setMembership(member.id, "ACTIVE", "Member")}>
                        Quick Approve
                      </button>
                    )}

                    {member.membershipStatus === "ACTIVE" && (
                      <button
                        className={styles.undoButton}
                        onClick={() => setMembership(member.id, "PENDING")}
                      >
                        Undo Approval
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className={styles.empty}>No students match these filters.</div>
        )}
      </div>
    </div>
  );
}
