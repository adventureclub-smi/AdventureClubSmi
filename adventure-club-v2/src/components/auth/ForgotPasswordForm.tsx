"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import styles from "./ForgotPasswordForm.module.scss";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setStatus(data.message);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }

    setLoading(false);
  };

  if (status) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>{status}</p>

        <p className={styles.backToLogin}>
          <Link href="/login">Back to Login</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        Enter the email you signed up with and we&apos;ll send you a link to
        reset your password.
      </p>

      <div className={styles.inputGroup}>
        <Mail size={20} className={styles.icon} />

        <input
          type="email"
          name="email"
          placeholder="College Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <p className={styles.backToLogin}>
        <Link href="/login">Back to Login</Link>
      </p>
    </form>
  );
}
