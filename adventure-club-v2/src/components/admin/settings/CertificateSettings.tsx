"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CertificateSettings.module.scss";

export default function CertificateSettings() {
  const [facultyHeadName, setFacultyHeadName] = useState("");
  const [presidentName, setPresidentName] = useState("");

  const [facultyHeadSignatureUrl, setFacultyHeadSignatureUrl] = useState("");
  const [presidentSignatureUrl, setPresidentSignatureUrl] = useState("");

  const [facultyHeadSignatureFile, setFacultyHeadSignatureFile] = useState<File | null>(null);
  const [presidentSignatureFile, setPresidentSignatureFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const facultyInputRef = useRef<HTMLInputElement>(null);
  const presidentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/certificate");
        if (!res.ok || !active) return;

        const data = await res.json();

        setFacultyHeadName(data.facultyHeadName || "");
        setPresidentName(data.presidentName || "");
        setFacultyHeadSignatureUrl(data.facultyHeadSignatureUrl || "");
        setPresidentSignatureUrl(data.presidentSignatureUrl || "");
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

  function handleSignatureChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      setStatus("Signatures must be PNG files (with a transparent background).");
      return;
    }

    setFile(file);
    setStatus("");
  }

  async function save() {
    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("facultyHeadName", facultyHeadName);
      form.append("presidentName", presidentName);
      if (facultyHeadSignatureFile) form.append("facultyHeadSignatureFile", facultyHeadSignatureFile);
      if (presidentSignatureFile) form.append("presidentSignatureFile", presidentSignatureFile);

      const res = await fetch("/api/admin/settings/certificate", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save.");
        return;
      }

      setFacultyHeadSignatureUrl(data.facultyHeadSignatureUrl || "");
      setPresidentSignatureUrl(data.presidentSignatureUrl || "");
      setFacultyHeadSignatureFile(null);
      setPresidentSignatureFile(null);
      if (facultyInputRef.current) facultyInputRef.current.value = "";
      if (presidentInputRef.current) presidentInputRef.current.value = "";
      setStatus("Certificate settings saved.");
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
        title="Certificate Signatories"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Certificate Signatories" },
        ]}
      />

      <p className={styles.subtitle}>
        These names and signatures print on every certificate generated for
        students — update them whenever the club&apos;s President or Faculty
        Head changes, no code changes needed.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <div className={styles.signatoryBlock}>
          <h3>Faculty Head</h3>

          <label>Name</label>
          <input
            value={facultyHeadName}
            onChange={(e) => setFacultyHeadName(e.target.value)}
            placeholder="e.g. Dr. A. B. Sharma"
          />

          <label>Signature (PNG, transparent background)</label>
          <input
            ref={facultyInputRef}
            type="file"
            accept="image/png"
            onChange={(e) => handleSignatureChange(e, setFacultyHeadSignatureFile)}
          />

          {(facultyHeadSignatureFile || facultyHeadSignatureUrl) && (
            <div className={styles.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  facultyHeadSignatureFile
                    ? URL.createObjectURL(facultyHeadSignatureFile)
                    : facultyHeadSignatureUrl
                }
                alt="Faculty Head signature preview"
                className={styles.preview}
              />
            </div>
          )}
        </div>

        <div className={styles.signatoryBlock}>
          <h3>President</h3>

          <label>Name</label>
          <input
            value={presidentName}
            onChange={(e) => setPresidentName(e.target.value)}
            placeholder="e.g. Rahul Mehta"
          />

          <label>Signature (PNG, transparent background)</label>
          <input
            ref={presidentInputRef}
            type="file"
            accept="image/png"
            onChange={(e) => handleSignatureChange(e, setPresidentSignatureFile)}
          />

          {(presidentSignatureFile || presidentSignatureUrl) && (
            <div className={styles.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  presidentSignatureFile
                    ? URL.createObjectURL(presidentSignatureFile)
                    : presidentSignatureUrl
                }
                alt="President signature preview"
                className={styles.preview}
              />
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Certificate Settings"}
        </button>
      </div>
    </div>
  );
}
