"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Hash, Phone, GraduationCap, BookOpen } from "lucide-react";

import styles from "./GuestRegistrationForm.module.scss";
import {
  SMI,
  OTHER_DEPARTMENTS,
  BDES,
  BFA,
  FACULTY,
  SMI_UNDERGRAD_PROGRAMS,
  SMI_POSTGRAD_PROGRAMS,
  BDES_COURSES,
  BFA_COURSES,
  YEARS,
} from "@/lib/academic-options";

export default function GuestRegistrationForm({
  trekId,
  onSuccess,
  onCancel,
}: {
  trekId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [year, setYear] = useState("");

  const [institution, setInstitution] = useState("");
  const [institutionOther, setInstitutionOther] = useState("");
  const [program, setProgram] = useState("");
  const [course, setCourse] = useState("");
  const [courseOther, setCourseOther] = useState("");

  const isSMI = institution === SMI;
  const isFaculty = year === FACULTY;
  const hasStructuredCourses = program === BDES || program === BFA;

  function handleInstitutionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setInstitution(e.target.value);
    setInstitutionOther("");
    setProgram("");
    setCourse("");
    setCourseOther("");
  }

  function handleProgramSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setProgram(e.target.value);
    setCourse("");
    setCourseOther("");
  }

  function handleCourseSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCourse(e.target.value);
    setCourseOther("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const finalInstitution =
      institution === "Other" ? institutionOther.trim() : institution;

    const finalCourse = hasStructuredCourses
      ? course === "Other"
        ? courseOther.trim()
        : course
      : course.trim();

    setLoading(true);

    try {
      const res = await fetch("/api/registrations/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId,
          guestName: fullName,
          guestRollNo: rollNo,
          guestPhoneNumber: phoneNumber,
          guestInstitution: finalInstitution,
          guestDepartment: isFaculty ? FACULTY : program,
          guestCourse: isFaculty ? FACULTY : finalCourse,
          guestYear: year,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.accountNudge}>
        A free NAVIRA account is one click away and lets you track this (and
        every future) registration, payment, and certificate in one place.{" "}
        <Link href="/signup">Create one instead</Link>.
      </p>

      <div className={styles.inputGroup}>
        <User size={18} className={styles.icon} />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <Hash size={18} className={styles.icon} />
          <input
            type="text"
            placeholder="Roll Number"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <Phone size={18} className={styles.icon} />
          <input
            type="tel"
            placeholder="Contact Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.inputGroup}>
          <GraduationCap size={18} className={styles.icon} />
          <select value={year} onChange={(e) => setYear(e.target.value)} required>
            <option value="" disabled>
              Year
            </option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
            <option disabled>──────────</option>
            <option value={FACULTY}>{FACULTY}</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <GraduationCap size={18} className={styles.icon} />
          <select value={institution} onChange={handleInstitutionChange} required>
            <option value="" disabled>
              Department
            </option>
            <option value={SMI}>{SMI}</option>
            <option disabled>──────────</option>
            {OTHER_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {institution === "Other" && (
        <div className={styles.inputGroup}>
          <GraduationCap size={18} className={styles.icon} />
          <input
            type="text"
            placeholder="Enter your department"
            value={institutionOther}
            onChange={(e) => setInstitutionOther(e.target.value)}
            required
          />
        </div>
      )}

      {isSMI && !isFaculty && (
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <GraduationCap size={18} className={styles.icon} />
            <select value={program} onChange={handleProgramSelectChange} required>
              <option value="" disabled>
                Program
              </option>
              {SMI_UNDERGRAD_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option disabled>──────────</option>
              {SMI_POSTGRAD_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <BookOpen size={18} className={styles.icon} />
            {hasStructuredCourses ? (
              <select value={course} onChange={handleCourseSelectChange} required>
                <option value="" disabled>
                  Course
                </option>
                {(program === BDES ? BDES_COURSES : BFA_COURSES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder="Course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
              />
            )}
          </div>
        </div>
      )}

      {hasStructuredCourses && course === "Other" && (
        <div className={styles.inputGroup}>
          <BookOpen size={18} className={styles.icon} />
          <input
            type="text"
            placeholder="Enter your course"
            value={courseOther}
            onChange={(e) => setCourseOther(e.target.value)}
            required
          />
        </div>
      )}

      {!isSMI && institution !== "" && !isFaculty && (
        <div className={styles.inputGroup}>
          <BookOpen size={18} className={styles.icon} />
          <input
            type="text"
            placeholder="Course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
          />
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Back
        </button>

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Registering..." : "Register as Guest"}
        </button>
      </div>
    </form>
  );
}
