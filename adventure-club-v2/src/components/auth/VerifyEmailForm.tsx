"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import styles from "./ForgotPasswordForm.module.scss";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
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

    setResending(false);
  }

  if (!email) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>
          We couldn&apos;t tell which account to verify. Please sign up again or
          log in.
        </p>

        <p className={styles.backToLogin}>
          <Link href="/signup">Back to Sign Up</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below —
        it expires in 10 minutes.
      </p>

      <div className={styles.inputGroup}>
        <KeyRound size={20} className={styles.icon} />

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          autoFocus
          required
        />
      </div>

      {status && <p className={styles.status}>{status}</p>}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Verifying..." : "Verify Email"}
      </button>

      <p className={styles.backToLogin}>
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className={styles.linkButton}
        >
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </p>

      <p className={styles.backToLogin}>
        <Link href="/login">Back to Login</Link>
      </p>
    </form>
  );
}
