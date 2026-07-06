"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./PaymentSettings.module.scss";

export default function PaymentSettings() {
  const [clubName, setClubName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/payment");
        if (!res.ok || !active) return;

        const data = await res.json();

        setClubName(data.clubName || "");
        setReceiverName(data.receiverName || "");
        setUpiId(data.upiId || "");
        setSupportPhone(data.supportPhone || "");
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/settings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubName, receiverName, upiId, supportPhone }),
      });

      setStatus(res.ok ? "Payment settings saved." : "Failed to save.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.hint}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Payment Settings"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Payment" },
        ]}
      />

      <p className={styles.subtitle}>
        These settings are used for every payment page automatically.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <label>Club Name</label>
        <input value={clubName} onChange={(e) => setClubName(e.target.value)} />

        <label>Receiver Name</label>
        <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />

        <label>UPI ID</label>
        <input
          placeholder="club@oksbi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />

        <label>Support Phone</label>
        <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
