"use client";

import { useEffect, useState } from "react";
import styles from "./MyRegistrations.module.scss";

type Registration = {
  id: string;
  status: string;
  paymentDeadline: string | null;

  trek: {
    id: string;
    title: string;
    destination: string;
    date: string;
    coverImage?: string;
  };
};

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<
    Registration[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-registrations")
      .then((res) => res.json())
      .then((data) => {
        setRegistrations(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>My Registrations</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className={styles.container}>
        <h1>My Registrations</h1>

        <div className={styles.empty}>
          <h2>No registrations yet.</h2>

          <p>
            Register for a trek to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Registrations</h1>

      <div className={styles.grid}>
        {registrations.map((registration) => (
          <div
            key={registration.id}
            className={styles.card}
          >
            <img
              src={
                registration.trek.coverImage ||
                "/images/default-trek.jpg"
              }
              alt={registration.trek.title}
            />

            <div className={styles.content}>
              <h2>{registration.trek.title}</h2>

              <p>
                📍 {registration.trek.destination}
              </p>

              <p>
                📅{" "}
                {new Date(
                  registration.trek.date
                ).toLocaleDateString()}
              </p>

              <span
                className={`${styles.badge} ${
                  styles[
                    registration.status.toLowerCase()
                  ]
                }`}
              >
                {registration.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}