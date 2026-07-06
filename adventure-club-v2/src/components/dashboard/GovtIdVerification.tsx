"use client";

import { useRef, useState } from "react";
import { ShieldCheck, Lock, UploadCloud, AlertTriangle } from "lucide-react";

import StatusBadge from "./shared/StatusBadge";
import styles from "./GovtIdVerification.module.scss";

const ID_TYPES: { value: string; label: string }[] = [
  { value: "PAN", label: "PAN Card" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
];

export type GovtIdData = {
  govtIdType: string | null;
  govtIdNumber: string | null;
  govtIdImageUrl: string | null;
  govtIdStatus: string;
  govtIdLocked: boolean;
};

export default function GovtIdVerification({
  data,
  onUpdated,
}: {
  data: GovtIdData;
  onUpdated: (data: GovtIdData) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [idType, setIdType] = useState(data.govtIdType || "");
  const [idNumber, setIdNumber] = useState(data.govtIdNumber || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(data.govtIdImageUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!idType || !idNumber.trim()) {
      setStatus("Select an ID type and enter the ID number.");
      return;
    }

    if (!file && !data.govtIdImageUrl) {
      setStatus("Please upload a photo of your ID.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("idType", idType);
      form.append("idNumber", idNumber.trim());
      if (file) form.append("file", file);

      const res = await fetch("/api/profile/govt-id", {
        method: "POST",
        body: form,
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus(result.message || "Failed to submit.");
        return;
      }

      setStatus("Submitted for verification.");
      onUpdated({
        govtIdType: result.govtIdType,
        govtIdNumber: result.govtIdNumber,
        govtIdImageUrl: result.govtIdImageUrl,
        govtIdStatus: result.govtIdStatus,
        govtIdLocked: result.govtIdLocked,
      });
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel = ID_TYPES.find((t) => t.value === data.govtIdType)?.label;

  if (data.govtIdLocked) {
    return (
      <section className={styles.card}>
        <h2>
          <ShieldCheck size={18} /> Government ID
        </h2>

        <div className={styles.lockedBanner}>
          <Lock size={18} />
          <div>
            <strong>Verified &amp; Locked</strong>
            <p>Contact the admin if you need to update these details.</p>
          </div>
        </div>

        <div className={styles.readonlyGrid}>
          <div>
            <span>ID Type</span>
            <strong>{typeLabel || "-"}</strong>
          </div>

          <div>
            <span>ID Number</span>
            <strong>{data.govtIdNumber || "-"}</strong>
          </div>
        </div>

        {data.govtIdImageUrl && (
          <a
            href={data.govtIdImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewDocLink}
          >
            View uploaded document
          </a>
        )}
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h2>
        <ShieldCheck size={18} /> Government ID
      </h2>

      <p className={styles.important}>
        <AlertTriangle size={14} />
        Important &amp; mandatory for booking government trek permits.
      </p>

      {data.govtIdStatus === "PENDING" && (
        <div className={styles.badgeRow}>
          <StatusBadge text="Waiting for Verification" tone="waiting" />
        </div>
      )}

      {data.govtIdStatus === "VERIFIED" && (
        <div className={styles.badgeRow}>
          <StatusBadge text="Verified" tone="success" />
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <div>
            <label>ID Type</label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)}>
              <option value="">Select ID type...</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>ID Number</label>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. ABCDE1234F"
            />
          </div>
        </div>

        <input
          hidden
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFile}
        />

        <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="ID document preview" className={styles.preview} />
          ) : (
            <>
              <UploadCloud size={26} />
              <p>Click to upload a photo of your ID</p>
            </>
          )}
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? "Submitting..." : "Submit Government ID"}
        </button>
      </form>
    </section>
  );
}
