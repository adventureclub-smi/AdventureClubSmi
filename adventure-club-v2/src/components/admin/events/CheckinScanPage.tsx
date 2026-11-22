"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import styles from "./CheckinScanPage.module.scss";

type Registration = {
  id: string;
  shortCode: string;
  attendanceMarked: boolean;
  user: { fullName: string; clubId: string } | null;
  guestName: string | null;
  guestPhone: string | null;
};

// What a scanned QR code actually opens — a phone's own camera app reads
// the QR, follows the link straight here, and whoever's logged in on that
// phone (a core member at the check-in desk) gets one button to tap. No
// custom in-browser camera scanner needed.
export default function CheckinScanPage({ eventId, code }: { eventId: string; code: string }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/checkin?code=${encodeURIComponent(code)}`);
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const json = await res.json();
        if (active) setRegistration(json.registration);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [eventId, code]);

  async function toggle(present: boolean) {
    if (!registration) return;
    setActing(true);

    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: registration.id, present }),
    });

    const json = await res.json().catch(() => null);
    setActing(false);

    if (res.ok) {
      setRegistration(json.registration);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Looking up code {code}...</p>
      </div>
    );
  }

  if (notFound || !registration) {
    return (
      <div className={styles.container}>
        <XCircle size={40} className={styles.errorIcon} />
        <h1>No registration found</h1>
        <p>Code {code} doesn&apos;t match anyone registered for this event.</p>
        <Link href={`/admin/events/${eventId}`}>Back to event</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.code}>{registration.shortCode}</span>
      <h1>{registration.user?.fullName ?? registration.guestName ?? "Guest"}</h1>
      <p className={styles.clubId}>{registration.user?.clubId ?? registration.guestPhone ?? ""}</p>

      {registration.attendanceMarked ? (
        <>
          <div className={styles.statusRow}>
            <CheckCircle2 size={22} className={styles.okIcon} />
            Checked in
          </div>
          <button className={styles.undoButton} disabled={acting} onClick={() => toggle(false)}>
            {acting ? "Undoing..." : "Undo check-in"}
          </button>
        </>
      ) : (
        <button className={styles.presentButton} disabled={acting} onClick={() => toggle(true)}>
          {acting ? "Marking..." : "Mark Present"}
        </button>
      )}

      <Link className={styles.backLink} href={`/admin/events/${eventId}`}>
        Back to event
      </Link>
    </div>
  );
}
