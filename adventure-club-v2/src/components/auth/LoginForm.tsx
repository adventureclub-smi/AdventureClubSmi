"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import styles from "./LoginForm.module.scss";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      alert("Login successful!");

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      {/* Email / Phone / Club ID */}

      <div className={styles.inputGroup}>
        <User size={20} className={styles.icon} />

        <input
          type="text"
          name="identifier"
          placeholder="Email / Phone / Adventure Club ID"
          value={formData.identifier}
          onChange={handleChange}
          required
        />
      </div>

      {/* Password */}

      <div className={styles.inputGroup}>
        <Lock size={20} className={styles.icon} />

        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button
          type="button"
          className={styles.eye}
          onClick={() =>
            setShowPassword(!showPassword)
          }
        >
          {showPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>

      <div className={styles.options}>
        <label>
          <input type="checkbox" />
          Remember me
        </label>

        <Link href="/forgot-password">
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        className={styles.loginBtn}
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className={styles.signup}>
        Don't have an account?{" "}
        <Link href="/signup">
          Create one
        </Link>
      </p>
    </form>
  );
}