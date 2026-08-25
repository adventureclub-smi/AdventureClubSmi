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
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const settingsRes = await fetch("/api/recruitment/settings");
        if (!settingsRes.ok || !active) return;

        const settings = await settingsRes.json();
        if (!settings.isOpen) return;

        // An applicant still needs a way back to view/edit/withdraw their
        // submission for as long as the window stays open — hiding the
        // banner the moment they applied cut off the only entry point,
        // since there's no sidebar link. It only ever changes the copy
        // below, never hides on account of an existing application.
        if (settings.loggedIn) {
          const applicationRes = await fetch("/api/recruitment");
          if (applicationRes.ok && active) {
            const application = await applicationRes.json();
            if (application) setAlreadyApplied(true);
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
        <strong>
          {alreadyApplied ? "Your NAVIRA Recruitment application is in!" : "NAVIRA Recruitment is open!"}
        </strong>
        <span>
          {alreadyApplied
            ? "View or edit your application any time before the window closes."
            : "Apply now to join a team — Web & Tech, Visual Media, Marketing, and more."}
        </span>
      </span>

      <span className={styles.cta}>
        {alreadyApplied ? "View Application" : "Apply Now"} <ArrowRight size={18} />
      </span>
    </Link>
  );
}
