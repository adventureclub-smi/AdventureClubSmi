"use client";

import { useEffect, useState } from "react";
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

export default function MembersTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");

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

  const filtered = members.filter((member) =>
    `${member.fullName} ${member.clubId} ${member.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function approve(id: string) {
    await fetch(`/api/admin/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipStatus: "ACTIVE", clubRole: "Member" }),
    });

    setMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, membershipStatus: "ACTIVE" } : member
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
                  {member.membershipStatus === "PENDING" ? (
                    <button onClick={() => approve(member.id)}>Approve</button>
                  ) : (
                    <Link href={`/admin/members/${member.id}`}>
                      <button>Manage</button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
