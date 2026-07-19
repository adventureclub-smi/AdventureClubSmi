"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Mail, Phone, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./ContactSubmissionsTable.module.scss";

type Category = "ISSUE" | "INFORMATION" | "SIGNUP_PROBLEM" | "PAYMENT_ISSUE";

type Submission = {
  id: string;
  category: Category;
  message: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  createdAt: string;
  user: { clubId: string; fullName: string } | null;
};

const CATEGORY_LABELS: Record<Category, string> = {
  ISSUE: "Issue",
  INFORMATION: "Information Request",
  SIGNUP_PROBLEM: "Sign Up Problem",
  PAYMENT_ISSUE: "Payment Issue",
};

type CategoryFilter = "all" | Category;
type StatusFilter = "all" | "PENDING" | "RESOLVED";

export default function ContactSubmissionsTable() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/contact");
      if (!res.ok) return;
      setSubmissions(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/contact");
        if (!res.ok || !active) return;
        setSubmissions(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  async function toggleStatus(id: string, current: string) {
    setUpdating(id);

    try {
      await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: current === "RESOLVED" ? "PENDING" : "RESOLVED" }),
      });

      await load();
    } finally {
      setUpdating(null);
    }
  }

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [submissions, categoryFilter, statusFilter]);

  const pendingCount = submissions.filter((s) => s.status !== "RESOLVED").length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Contact"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Contact" }]}
      />

      <p className={styles.subtitle}>
        <MessageCircle size={14} /> {pendingCount} pending of {submissions.length} total submissions
        from the Contact Us page.
      </p>

      <div className={styles.filterBar}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <span className={styles.resultCount}>{filtered.length} shown</span>
      </div>

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No submissions match this filter.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((submission) => (
            <div key={submission.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.categoryBadge}>
                    {CATEGORY_LABELS[submission.category]}
                  </span>

                  <h3>
                    {submission.user?.fullName ?? submission.name ?? "Anonymous"}
                    {submission.user?.clubId && <span> · {submission.user.clubId}</span>}
                  </h3>

                  <p className={styles.meta}>
                    {submission.email && (
                      <span>
                        <Mail size={13} /> {submission.email}
                      </span>
                    )}

                    {submission.phoneNumber && (
                      <span>
                        <Phone size={13} /> {submission.phoneNumber}
                      </span>
                    )}

                    <span>{new Date(submission.createdAt).toLocaleString("en-IN")}</span>
                  </p>
                </div>

                <StatusBadge
                  text={submission.status === "RESOLVED" ? "Resolved" : "Pending"}
                  tone={submission.status === "RESOLVED" ? "success" : "waiting"}
                />
              </div>

              <p className={styles.message}>{submission.message}</p>

              <button
                className={submission.status === "RESOLVED" ? styles.undoButton : styles.resolveButton}
                disabled={updating === submission.id}
                onClick={() => toggleStatus(submission.id, submission.status)}
              >
                <CheckCircle2 size={14} />
                {updating === submission.id
                  ? "Working..."
                  : submission.status === "RESOLVED"
                  ? "Reopen"
                  : "Mark Resolved"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
