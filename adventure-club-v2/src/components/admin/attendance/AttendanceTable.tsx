"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import styles from "./AttendanceTable.module.scss";

type Student = {
  id: string;
  attendanceMarked: boolean;
  createdAt: string;
  guestName: string | null;
  guestPhoneNumber: string | null;
  guestDepartment: string | null;
  guestYear: string | null;
  user: {
    fullName: string;
    clubId: string;
    phoneNumber: string;
    department: string;
    year: string;
  } | null;
};

export default function AttendanceTable({ trekId }: { trekId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("registration");

  async function loadAttendance() {
    const res = await fetch(`/api/admin/attendance/${trekId}`);
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch(`/api/admin/attendance/${trekId}`);
      const data = await res.json();
      if (active) setStudents(Array.isArray(data) ? data : []);
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

  async function toggleAttendance(student: Student) {
    await fetch(`/api/admin/attendance/mark/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceMarked: !student.attendanceMarked }),
    });

    loadAttendance();
  }

  const filtered = useMemo(() => {
    let data = [...students];

    const name = (s: Student) => s.user?.fullName ?? s.guestName ?? "";
    const year = (s: Student) => s.user?.year ?? s.guestYear ?? "";
    const department = (s: Student) => s.user?.department ?? s.guestDepartment ?? "";

    data = data.filter((student) => name(student).toLowerCase().includes(search.toLowerCase()));

    switch (sortBy) {
      case "az":
        data.sort((a, b) => name(a).localeCompare(name(b)));
        break;

      case "year":
        data.sort((a, b) => year(a).localeCompare(year(b)));
        break;

      case "course":
        data.sort((a, b) => department(a).localeCompare(department(b)));
        break;

      default:
        data.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }

    return data;
  }, [students, search, sortBy]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <Search size={15} />
          <input
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="registration">Registration Order</option>
          <option value="az">A-Z</option>
          <option value="course">Course</option>
          <option value="year">Year</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No participants found.</div>
      ) : (
        filtered.map((student) => (
          <div key={student.id} className={styles.card}>
            <div>
              <h3>{student.user?.fullName ?? student.guestName ?? "Unknown"}</h3>
              <p>{student.user?.clubId ?? "Guest record"}</p>
              <p>{student.user?.phoneNumber ?? student.guestPhoneNumber ?? "-"}</p>
              <p>
                {student.user?.department ?? student.guestDepartment ?? "-"} •{" "}
                {student.user?.year ?? student.guestYear ?? "-"}
              </p>
            </div>

            <button
              className={student.attendanceMarked ? styles.undoButton : styles.presentButton}
              onClick={() => toggleAttendance(student)}
            >
              {student.attendanceMarked && <CheckCircle2 size={15} />}
              {student.attendanceMarked ? "Present" : "Mark Present"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
