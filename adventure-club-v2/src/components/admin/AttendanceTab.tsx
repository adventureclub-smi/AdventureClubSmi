"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AttendanceTab.module.scss";

export default function AttendanceTab({
  trekId,
}: {
  trekId: string;
}) {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [registrations, setRegistrations] =
    useState<any[]>([]);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    setLoading(true);

    const res = await fetch(
      `/api/admin/attendance/${trekId}`
    );

    const data = await res.json();

    setRegistrations(data);

    setLoading(false);
  }

  async function toggleAttendance(
    registrationId: string,
    attended: boolean
  ) {
    setSaving(true);

    await fetch("/api/admin/attendance/mark", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        registrationId,
        attended,
      }),
    });

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              attendanceMarked: attended,
            }
          : r
      )
    );

    setSaving(false);
  }

  const filtered = useMemo(() => {
    return registrations.filter((r) =>
      r.user.fullName
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [registrations, search]);

  const present =
    registrations.filter(
      (r) => r.attendanceMarked
    ).length;

  if (loading)
    return <p>Loading attendance...</p>;

  return (
    <div className={styles.container}>

      <div className={styles.top}>

        <div>
          <h2>Attendance</h2>

          <p>
            Present {present} /{" "}
            {registrations.length}
          </p>
        </div>

        <input
          placeholder="Search Student..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      <div className={styles.list}>

        {filtered.map((registration) => (
          <div
            key={registration.id}
            className={styles.card}
          >

            <div>

              <h3>
                {registration.user.fullName}
              </h3>

              <p>
                {registration.user.clubId}
              </p>

            </div>

            <label className={styles.switch}>

              <input
                type="checkbox"
                checked={
                  registration.attendanceMarked
                }
                disabled={saving}
                onChange={(e) =>
                  toggleAttendance(
                    registration.id,
                    e.target.checked
                  )
                }
              />

              <span />

            </label>

          </div>
        ))}

      </div>

    </div>
  );
}