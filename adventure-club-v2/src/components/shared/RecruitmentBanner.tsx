"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import styles from "./RecruitmentBanner.module.scss";

export default function RecruitmentBanner({
  variant = "strip",
}: {
  // "strip" = edge-to-edge, no rounding (sits between full-width homepage
  // sections, like AnnouncementTicker). "card" = rounded, matches the other
  // banner/card elements inside the padded dashboard container.
  variant?: "strip" | "card";
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const settingsRes = await fetch("/api/recruitment/settings");
        if (!settingsRes.ok || !active) return;

        const settings = await settingsRes.json();
        if (!settings.isOpen) return;

        // Logged-in students who've already applied don't need the nudge —
        // an anonymous visitor (401 here) or one who hasn't applied yet
        // still sees the banner.
        if (settings.loggedIn) {
          const applicationRes = await fetch("/api/recruitment");
          if (applicationRes.ok && active) {
            const application = await applicationRes.json();
            if (application) return;
          }
        }

        if (active) setVisible(true);
      } catch {
        // non-critical
      }
    }

    check();

    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/dashboard/recruitment"
      className={variant === "card" ? `${styles.banner} ${styles.card}` : styles.banner}
    >
      <span className={styles.iconWrap}>
        <Sparkles size={26} />
      </span>

      <span className={styles.text}>
        <strong>NAVIRA Recruitment is open!</strong>
        <span>Apply now to join a team — Web &amp; Tech, Visual Media, Marketing, and more.</span>
      </span>

      <span className={styles.cta}>
        Apply Now <ArrowRight size={18} />
      </span>
    </Link>
  );
}
