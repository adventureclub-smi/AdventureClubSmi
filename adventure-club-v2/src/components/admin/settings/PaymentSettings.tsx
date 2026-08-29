"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./PaymentSettings.module.scss";

export default function PaymentSettings() {
  const [clubName, setClubName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrImageFile, setQrImageFile] = useState<File | null>(null);
  const [removeQrImage, setRemoveQrImage] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

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
        setQrImageUrl(data.customQrImageUrl || "");
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

  function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrImageFile(file);
    setRemoveQrImage(false);
  }

  function handleRemoveQr() {
    setQrImageFile(null);
    setQrImageUrl("");
    setRemoveQrImage(true);
    if (qrInputRef.current) qrInputRef.current.value = "";
  }

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("clubName", clubName);
      form.append("receiverName", receiverName);
      form.append("upiId", upiId);
      form.append("supportPhone", supportPhone);
      if (removeQrImage) form.append("removeQrImage", "true");
      if (qrImageFile) form.append("qrImageFile", qrImageFile);

      const res = await fetch("/api/admin/settings/payment", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save.");
        return;
      }

      setQrImageUrl(data.customQrImageUrl || "");
      setQrImageFile(null);
      setRemoveQrImage(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
      setStatus("Payment settings saved.");
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

        <label>Custom Payment QR (optional)</label>
        <p className={styles.hint}>
          By default students see a QR generated from your UPI ID above. If some UPI
          apps show it as invalid, upload a QR you already know scans correctly
          (e.g. a screenshot from your own UPI app) — students will see this exact
          image instead. Leave empty to keep using the generated one.
        </p>

        {qrImageUrl && !qrImageFile && (
          <div className={styles.qrPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="Current custom payment QR" />
            <button type="button" onClick={handleRemoveQr}>
              Remove custom QR
            </button>
          </div>
        )}

        <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrFileChange} />

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
