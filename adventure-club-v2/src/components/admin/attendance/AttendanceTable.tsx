"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import styles from "./AttendanceTable.module.scss";

type Student = {
  id: string;
  attendanceMarked: boolean;
  createdAt: string;
  user: {
    fullName: string;
    clubId: string;
    phoneNumber: string;
    department: string;
    year: string;
  };
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

    data = data.filter((student) =>
      (student.user?.fullName || "").toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case "az":
        data.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
        break;

      case "year":
        data.sort((a, b) => (a.user.year || "").localeCompare(b.user.year || ""));
        break;

      case "course":
        data.sort((a, b) => (a.user.department || "").localeCompare(b.user.department || ""));
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
              <h3>{student.user.fullName}</h3>
              <p>{student.user.clubId}</p>
              <p>{student.user.phoneNumber}</p>
              <p>
                {student.user.department} • {student.user.year}
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
