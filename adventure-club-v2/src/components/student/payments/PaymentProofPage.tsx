"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2 } from "lucide-react";

import BackButton from "@/components/dashboard/shared/BackButton";
import styles from "./PaymentProofPage.module.scss";

const MAX_SCREENSHOT_BYTES = 1024 * 1024; // 1MB

type Props = {
  registrationId: string;
  paymentType: "INITIAL" | "FINAL";
};

export default function PaymentProofPage({ registrationId, paymentType }: Props) {
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(selected: File | null) {
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (selected.size > MAX_SCREENSHOT_BYTES) {
      setError(
        "That screenshot is over 1MB. Please compress it (or crop out anything unnecessary) and try again."
      );
      setFile(null);
      setPreview(null);
      return;
    }

    setError(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }

  async function submit() {
    if (!transactionId && !file) {
      setError("Enter a Transaction ID or upload a screenshot.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("registrationId", registrationId);
      form.append("transactionId", transactionId);
      form.append("type", paymentType);
      if (file) form.append("screenshot", file);

      const res = await fetch("/api/student/payment/proof", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || "Failed to submit payment. Please try again.");
        return;
      }

      window.location.href = `/student/payments/${registrationId}/submitted`;
    } catch {
      setError("Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BackButton />

        <h1>Payment Proof</h1>

        <p className={styles.subtitle}>
          Upload your payment screenshot or enter the UTR / Transaction ID. The
          club will verify it shortly.
        </p>

        <div className={styles.field}>
          <label>Transaction ID / UTR</label>
          <input
            type="text"
            placeholder="Enter Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
        </div>

        <label className={styles.upload}>
          {preview ? (
            <img src={preview} alt="Screenshot preview" className={styles.preview} />
          ) : (
            <>
              <UploadCloud size={32} />
              <strong>Tap to upload payment screenshot</strong>
              <span>PNG or JPG, up to 1MB</span>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {file && (
          <p className={styles.fileName}>
            <CheckCircle2 size={15} /> {file.name}
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submit} onClick={submit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </motion.div>
    </div>
  );
}
