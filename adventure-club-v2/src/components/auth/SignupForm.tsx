"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import styles from "./SignupForm.module.scss";

export default function SignupForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] =useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    institution: "Srishti Manipal Institute",
    email: "",
    phoneNumber: "",
    department: "",
    year: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          institution: formData.institution,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          department: formData.department,
          year: formData.year,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      alert("Account created successfully!");

      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Row 1 */}

      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <User size={20} className={styles.icon} />

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <GraduationCap
            size={20}
            className={styles.icon}
          />

          <select
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            required
          >
            <option value="Srishti Manipal Institute">
              Srishti Manipal Institute
            </option>
          </select>
        </div>
      </div>

      {/* Row 2 */}

      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <Mail size={20} className={styles.icon} />

          <input
            type="email"
            name="email"
            placeholder="College Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <Phone size={20} className={styles.icon} />

          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Row 3 */}

      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <GraduationCap
            size={20}
            className={styles.icon}
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Department</option>
            <option>B.Des</option>
            <option>M.Des</option>
            <option>BFA</option>
            <option>MFA</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <GraduationCap
            size={20}
            className={styles.icon}
          />

          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          >
            <option value="">Year</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
        </div>
      </div>

      {/* Password */}

      <div className={styles.row}>
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

        <div className={styles.inputGroup}>
          <Lock size={20} className={styles.icon} />

          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button
            type="button"
            className={styles.eye}
            onClick={() =>
              setShowConfirm(!showConfirm)
            }
          >
            {showConfirm ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Terms */}

      <label className={styles.checkbox}>
        <input type="checkbox" required />
        I agree to the Terms & Conditions
      </label>

      {/* Button */}

      <button
        className={styles.signupBtn}
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Creating Account..."
          : "Create Account"}
      </button>

      {/* Login */}

      <p className={styles.login}>
        Already have an account?{" "}
        <Link href="/login">Login</Link>
      </p>
    </form>
  );
}