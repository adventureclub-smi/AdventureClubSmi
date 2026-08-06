"use client";

import { useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./EmailBroadcast.module.scss";

export default function EmailBroadcast() {
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCount() {
      try {
        const res = await fetch("/api/admin/email-broadcast");
        if (!res.ok || !active) return;
        const data = await res.json();
        setRecipientCount(data.count);
      } catch {
        // non-critical
      }
    }

    loadCount();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !content.trim()) {
      setStatus("Subject and message are both required.");
      return;
    }

    const confirmed = confirm(
      `Send this email to all ${recipientCount ?? ""} students who have created an account? This can't be undone.`
    );
    if (!confirmed) return;

    setSending(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/email-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), content: content.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus(data?.message || "Failed to send email.");
        return;
      }

      setStatus(`Email sent to ${data.count} student${data.count === 1 ? "" : "s"}.`);
      setSubject("");
      setContent("");
    } catch {
      setStatus("Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Email Students"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Email Students" }]}
      />

      <p className={styles.subtitle}>
        Send an email to every student who has created a NAVIRA account
        {recipientCount !== null ? ` (currently ${recipientCount}).` : "."}
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Important update about the upcoming trek"
            required
          />
        </div>

        <div>
          <label>Message</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write what you want every student to know..."
            required
          />
        </div>

        <button type="submit" disabled={sending}>
          <Send size={15} /> {sending ? "Sending..." : "Send to All Students"}
        </button>

        {status && <p className={styles.status}>{status}</p>}
      </form>

      <div className={styles.note}>
        <Mail size={16} />
        <p>
          Every student gets their own individual email (no one sees who else
          received it), and it&apos;s sent from NAVIRA SMI&apos;s usual
          address.
        </p>
      </div>
    </div>
  );
}
