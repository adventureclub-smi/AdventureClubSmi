"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import styles from "./ForgotPasswordForm.module.scss";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setStatus("Password reset! Redirecting to login...");

      setTimeout(() => router.push("/login"), 1800);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }

    setLoading(false);
  };

  if (!token) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>
          This reset link is missing or invalid. Please request a new one.
        </p>

        <p className={styles.backToLogin}>
          <Link href="/forgot-password">Request a new link</Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.form}>
        <p className={styles.status}>{status}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <Lock size={20} className={styles.icon} />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="button"
          className={styles.eye}
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className={styles.inputGroup}>
        <Lock size={20} className={styles.icon} />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {status && <p className={styles.status}>{status}</p>}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      <p className={styles.backToLogin}>
        <Link href="/login">Back to Login</Link>
      </p>
    </form>
  );
}
