"use client";

import styles from "./UpcomingTreks.module.scss";

const treks = [
  {
    name: "Kodachadri Trek",
    date: "12 Aug 2026",
    registrations: 42,
  },
  {
    name: "Kudremukh Trek",
    date: "28 Aug 2026",
    registrations: 35,
  },
  {
    name: "Mullayanagiri Trek",
    date: "15 Sep 2026",
    registrations: 57,
  },
];

export default function UpcomingTreks() {
  return (
    <div className={styles.card}>
      <h2>Upcoming Treks</h2>

      <div className={styles.list}>
        {treks.map((trek) => (
          <div className={styles.item} key={trek.name}>
            <div>
              <h3>{trek.name}</h3>
              <p>{trek.date}</p>
            </div>

            <span>{trek.registrations} Joined</span>
          </div>
        ))}
      </div>
    </div>
  );
}