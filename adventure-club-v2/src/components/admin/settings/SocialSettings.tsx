"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./SocialSettings.module.scss";

export default function SocialSettings() {
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/social");
        if (!res.ok || !active) return;

        const data = await res.json();

        setInstagram(data.instagram || "");
        setLinkedin(data.linkedin || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp || "");
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
      const res = await fetch("/api/admin/settings/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagram, linkedin, email, phone, whatsapp }),
      });

      setStatus(res.ok ? "Social links saved." : "Failed to save.");
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
        title="Social Links"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Social Links" },
        ]}
      />

      <p className={styles.subtitle}>
        These links power the Instagram and LinkedIn icons at the bottom of
        the homepage footer.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <label>Instagram URL</label>
        <input
          placeholder="https://www.instagram.com/adventure_smi"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />

        <label>LinkedIn URL</label>
        <input
          placeholder="https://www.linkedin.com/company/..."
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />

        <label>Contact Email (optional)</label>
        <input
          placeholder="hello@adventureclub.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Contact Phone (optional)</label>
        <input
          placeholder="+91 90000 00000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label>WhatsApp Number (for Contact Us page)</label>
        <input
          placeholder="919000000000 (country code, no spaces or +)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Social Links"}
        </button>
      </div>
    </div>
  );
}
