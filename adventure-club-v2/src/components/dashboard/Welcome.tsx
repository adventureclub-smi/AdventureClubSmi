"use client";

import styles from "./Welcome.module.scss";

export default function Welcome() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  return (
    <div className={styles.welcome}>
      <h1>
        Welcome back,
        <span> {user.fullName || "Explorer"} 👋</span>
      </h1>

      <p>
        Ready for your next adventure? Explore upcoming treks,
        register for events, and stay updated with the Adventure Club.
      </p>
    </div>
  );
}