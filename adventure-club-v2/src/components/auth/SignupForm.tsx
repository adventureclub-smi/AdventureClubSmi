"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import styles from "./SignupForm.module.scss";

const SMI = "Srishti Manipal Institute of Art, Design and Technology (SMI)";

const OTHER_DEPARTMENTS = [
  "Department of Commerce (DOC)",
  "T. A. Pai Management Institute (TAPMI)",
  "Manipal Law School (MLS)",
  "Department of Liberal Arts, Humanities and Social Sciences (DLHS)",
  "Department of Public Policy (DPP)",
];

const BDES = "Bachelor of Design (B.Des)";
const BFA = "Bachelor of Fine Arts (BFA)";

const SMI_UNDERGRAD_PROGRAMS = [BDES, BFA, "Bachelor of Vocation (B.Voc - 3 Years)"];
const SMI_POSTGRAD_PROGRAMS = ["Master of Design (M.Des)", "Master of Arts (MA)", "Master of Planning (M.Plan)"];

const BDES_COURSES = [
  "Business Service and Systems Design (BSSD)",
  "Creative and Applied Computation (CAC)",
  "Creative Education (CE)",
  "Human Centered Design (HCD)",
  "Information Arts and Information Design Practices (IAIDP)",
  "Spatial Design*",
  "Textile Futures",
  "Visual Communication & Strategic Branding (VCSB)",
  "Industrial Arts and Design Practices (IAID)",
];

const BFA_COURSES = ["Contemporary Art Practice", "Digital Media Arts", "Film"];

export default function SignupForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    year: "",
    password: "",
    confirmPassword: "",
  });

  const [institution, setInstitution] = useState("");
  const [institutionOther, setInstitutionOther] = useState("");
  const [program, setProgram] = useState("");
  const [course, setCourse] = useState("");
  const [courseOther, setCourseOther] = useState("");

  const isSMI = institution === SMI;
  const hasStructuredCourses = program === BDES || program === BFA;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const finalInstitution =
      institution === "Other" ? institutionOther.trim() : institution;

    const finalCourse = hasStructuredCourses
      ? course === "Other"
        ? courseOther.trim()
        : course
      : course.trim();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          institution: finalInstitution,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          department: program,
          course: finalCourse,
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
          <GraduationCap size={20} className={styles.icon} />

          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Year
            </option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
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

      {/* Department / Institute */}

      <div className={styles.rowFull}>
        <div className={styles.inputGroup}>
          <GraduationCap size={20} className={styles.icon} />

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
        <div className={styles.rowFull}>
          <div className={styles.inputGroup}>
            <GraduationCap size={20} className={styles.icon} />

            <input
              type="text"
              placeholder="Enter your department"
              value={institutionOther}
              onChange={(e) => setInstitutionOther(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {/* Program / Course — SMI gets the full structured picker; any other
          department just needs a plain course field, no program step. */}

      {isSMI && (
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <GraduationCap size={20} className={styles.icon} />

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
            <BookOpen size={20} className={styles.icon} />

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
        <div className={styles.rowFull}>
          <div className={styles.inputGroup}>
            <BookOpen size={20} className={styles.icon} />

            <input
              type="text"
              placeholder="Enter your course"
              value={courseOther}
              onChange={(e) => setCourseOther(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {!isSMI && institution !== "" && (
        <div className={styles.rowFull}>
          <div className={styles.inputGroup}>
            <BookOpen size={20} className={styles.icon} />

            <input
              type="text"
              placeholder="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </div>
        </div>
      )}

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
