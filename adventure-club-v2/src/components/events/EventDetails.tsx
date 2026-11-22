"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { CalendarDays, MapPin, Users, Trophy, User, Phone, Building2 } from "lucide-react";

import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import PaymentCountdown from "@/components/treks/PaymentCountdown";
import { registrationStateFor } from "@/lib/registration-journey";
import { colourToHex } from "@/lib/team-colours";
import styles from "./EventDetails.module.scss";

type Team = { id: string; name: string; colour: string; groupNumber: number | null };

type Match = {
  id: string;
  groupNumber: number | null;
  round: string | null;
  teamAId: string;
  teamBId: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
  winnerTeamId: string | null;
  status: string;
};

type StandingsRow = {
  teamId: string;
  teamName: string;
  teamColour: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  qualified: boolean;
};

type PublicData = {
  event: {
    id: string;
    title: string;
    destination: string;
    date: string;
    description: string;
    coverImage: string | null;
    seats: number;
    eventTeamSize: number | null;
    eventTeamsDrawnAt: string | null;
    registrationOpensAt: string | null;
    registrationClosesAt: string | null;
    registrationOpenedManually: boolean;
    registrationClosedManually: boolean;
  };
  registeredCount: number;
  loggedIn: boolean;
  isRegistered: boolean;
  myShortCode: string | null;
  myAttendanceMarked: boolean;
  myTeam: { id: string; name: string; colour: string; members: string[] } | null;
  teams: Team[];
  groupMatches: Match[];
  knockoutMatches: Match[];
  standings: { groupNumber: number | null; rows: StandingsRow[] }[];
};

const ROUND_LABELS: Record<string, string> = {
  FINAL: "Final",
  SEMIFINAL: "Semifinal",
  QUARTERFINAL: "Quarterfinal",
};

function teamName(teams: Team[], id: string | null) {
  if (!id) return "—";
  return teams.find((t) => t.id === id)?.name ?? "Unknown Team";
}

function teamColour(teams: Team[], id: string | null) {
  return teams.find((t) => t.id === id)?.colour ?? "";
}

export default function EventDetails({ eventId }: { eventId: string }) {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCollege, setGuestCollege] = useState("");
  const [guestConfirmation, setGuestConfirmation] = useState<{
    shortCode: string;
    qrDataUrl: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/public`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/public`);
        const json = await res.json();
        if (active) setData(json);
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    let active = true;

    async function generate() {
      if (!data?.myShortCode) {
        setQrDataUrl("");
        return;
      }

      const checkinUrl = `${window.location.origin}/admin/events/${eventId}/checkin?code=${data.myShortCode}`;
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#0d0d0d", light: "#ffffff" },
      });

      if (active) setQrDataUrl(dataUrl);
    }

    generate();

    return () => {
      active = false;
    };
  }, [data?.myShortCode, eventId]);

  async function handleRegister() {
    setSubmitting(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const json = await res.json().catch(() => null);

    setSubmitting(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to register.", error: true });
      return;
    }

    setMessage({ text: "You're registered!" });
    load();
  }

  async function handleGuestRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!guestName.trim() || !guestPhone.trim()) {
      setMessage({ text: "Name and phone are required.", error: true });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest: { name: guestName, phone: guestPhone, college: guestCollege || undefined },
      }),
    });

    const json = await res.json().catch(() => null);

    setSubmitting(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to register.", error: true });
      return;
    }

    // A guest has no account/session, so this page can never look their
    // registration back up on a future visit — their code/QR has to be
    // shown right here, right now, from the create response itself.
    const shortCode = json.registration.shortCode as string;
    const checkinUrl = `${window.location.origin}/admin/events/${eventId}/checkin?code=${shortCode}`;
    const dataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#0d0d0d", light: "#ffffff" },
    });

    setGuestConfirmation({ shortCode, qrDataUrl: dataUrl });
    setGuestName("");
    setGuestPhone("");
    setGuestCollege("");
    setGuestMode(false);
  }

  if (loading || !data) {
    return (
      <div className={styles.hero} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const {
    event,
    registeredCount,
    loggedIn,
    isRegistered,
    myShortCode,
    myAttendanceMarked,
    myTeam,
    teams,
    groupMatches,
    knockoutMatches,
    standings,
  } = data;

  const registrationState = registrationStateFor(event);
  const spotsLeft = event.seats < 99999 ? event.seats - registeredCount : null;
  const rounds = Array.from(new Set(knockoutMatches.map((m) => m.round ?? "")));
  const alreadyRegistered = isRegistered || !!guestConfirmation;

  return (
    <>
      <section className={styles.hero}>
        <Image src={event.coverImage || "/images/default-trek.jpg"} alt={event.title} fill priority className={styles.image} />

        <div className={styles.overlay} />

        <div className={styles.content}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p>{event.destination}</p>
            <h1>{event.title}</h1>
            <span>{new Date(event.date).toLocaleDateString("en-IN")}</span>
          </motion.div>
        </div>
      </section>

      <section className={styles.main}>
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>About This Event</h2>
          <p>{event.description}</p>
        </motion.div>

        <motion.div
          className={styles.right}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.price}>
            <h2>Free</h2>
            <span>Entry Fee</span>
          </div>

          <div className={styles.details}>
            <div>
              <span>
                <CalendarDays size={14} /> Date
              </span>
              <strong>{new Date(event.date).toLocaleDateString("en-IN")}</strong>
            </div>

            <div>
              <span>
                <MapPin size={14} /> Venue
              </span>
              <strong>{event.destination}</strong>
            </div>

            {event.eventTeamSize && (
              <div>
                <span>
                  <Users size={14} /> Team Size
                </span>
                <strong>~{event.eventTeamSize} / team</strong>
              </div>
            )}

            {spotsLeft !== null && (
              <div>
                <span>
                  <Trophy size={14} /> Spots Left
                </span>
                <strong>{spotsLeft}</strong>
              </div>
            )}
          </div>

          {message && (
            <p className={`${styles.status} ${message.error ? styles.statusError : ""}`}>{message.text}</p>
          )}

          {alreadyRegistered && (
            <>
              <div className={styles.qrRow}>
                {(qrDataUrl || guestConfirmation?.qrDataUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl || guestConfirmation?.qrDataUrl}
                    alt="Check-in QR code"
                    className={styles.qrImage}
                  />
                )}
                <div>
                  <span className={styles.qrLabel}>Your registration number</span>
                  <div className={styles.qrCode}>{myShortCode || guestConfirmation?.shortCode}</div>
                </div>
              </div>

              <div className={styles.badgeRow}>
                {myAttendanceMarked ? (
                  <StatusBadge text="Checked in on event day" tone="approved" />
                ) : (
                  <StatusBadge text="Registered" tone="waiting" />
                )}
              </div>

              {myTeam ? (
                <div style={{ marginTop: 18 }}>
                  <p style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span className={styles.swatch} style={{ background: colourToHex(myTeam.colour) }} />
                    Your Team: {myTeam.name}
                  </p>
                  <ul className={styles.teamList}>
                    {myTeam.members.map((name, i) => (
                      <li key={`${name}-${i}`}>{name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className={styles.note}>
                  Teams are formed physically on the day — show up and pick your chit.
                </p>
              )}

              {guestConfirmation && (
                <p className={styles.note}>
                  Screenshot this now — as a guest, this page can&apos;t look it back up for you later.
                </p>
              )}
            </>
          )}

          {!alreadyRegistered && event.eventTeamsDrawnAt && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registrations Closed" tone="danger" />
              </div>
              <p className={styles.note}>
                Team allocation has already started — registration for this event is closed.
              </p>
            </>
          )}

          {!alreadyRegistered && !event.eventTeamsDrawnAt && registrationState === "NOT_OPEN" && (
            <>
              {event.registrationOpensAt ? (
                <PaymentCountdown
                  deadline={event.registrationOpensAt}
                  heading="Registrations Open Soon"
                  subheading="Registrations open in"
                  expiredHeading="Registrations Opening"
                  expiredMessage="Registrations are about to open — check back shortly."
                />
              ) : (
                <>
                  <div className={styles.badgeRow}>
                    <StatusBadge text="Opening Soon" tone="waiting" />
                  </div>
                  <p className={styles.note}>Registration hasn&apos;t opened yet.</p>
                </>
              )}
            </>
          )}

          {!alreadyRegistered && !event.eventTeamsDrawnAt && registrationState === "CLOSED" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registrations Closed" tone="danger" />
              </div>
              <p className={styles.note}>Registration for this event is closed.</p>
            </>
          )}

          {!alreadyRegistered && !event.eventTeamsDrawnAt && registrationState === "OPEN" && (
            <>
              {event.registrationClosesAt && (
                <PaymentCountdown
                  deadline={event.registrationClosesAt}
                  heading="Registration Closing Soon"
                  subheading="Registration closes in"
                  expiredHeading="Registrations Closed"
                  expiredMessage="Registrations for this event are now closed."
                />
              )}

              {!guestMode ? (
                <>
                  {loggedIn ? (
                    <button onClick={handleRegister} disabled={submitting} className={styles.registerButton}>
                      {submitting ? "Registering..." : "Register Now"}
                    </button>
                  ) : (
                    <Link href={`/login?redirect=/events/${eventId}`} className={styles.registerButton}>
                      Continue with NAVIRA Account
                    </Link>
                  )}

                  <button type="button" className={styles.guestLink} onClick={() => setGuestMode(true)}>
                    {loggedIn ? "Register someone without a club account" : "Continue as Guest"}
                  </button>

                  <p className={styles.note}>
                    Come alone — no need to register with a group. Teams are formed on the day by picking a
                    chit from a bag.
                  </p>
                </>
              ) : (
                <form className={styles.form} onSubmit={handleGuestRegister}>
                  <div className={styles.inputGroup}>
                    <User size={18} className={styles.icon} />
                    <input
                      placeholder="Full name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <Phone size={18} className={styles.icon} />
                    <input
                      placeholder="Phone number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <Building2 size={18} className={styles.icon} />
                    <input
                      placeholder="College / organisation (optional)"
                      value={guestCollege}
                      onChange={(e) => setGuestCollege(e.target.value)}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={() => setGuestMode(false)}>
                      Back
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={submitting}>
                      {submitting ? "Registering..." : "Register as Guest"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className={styles.divider} />

          <div className={styles.navActions}>
            {loggedIn && (
              <Link href="/dashboard" className={styles.navButton}>
                Back to Student Dashboard
              </Link>
            )}

            <Link href="/" className={styles.navButton}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </section>

      <div className={styles.lowerSection}>
        {standings.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Points Table</h2>
            {standings.map((group) => (
              <table key={String(group.groupNumber)} className={styles.table}>
                <thead>
                  <tr>
                    <th>{group.groupNumber ? `Group ${group.groupNumber}` : "Team"}</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.teamId} className={row.qualified ? styles.qualifiedRow : ""}>
                      <td>
                        <span className={styles.swatch} style={{ background: colourToHex(row.teamColour) }} />{" "}
                        {row.teamName}
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </>
        )}

        {groupMatches.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Fixtures</h2>
            {groupMatches.map((match) => (
              <div key={match.id} className={styles.matchRow}>
                <span className={match.winnerTeamId === match.teamAId ? styles.winnerName : ""}>
                  <span
                    className={styles.swatch}
                    style={{ background: colourToHex(teamColour(teams, match.teamAId)) }}
                  />{" "}
                  {teamName(teams, match.teamAId)}
                </span>
                {" vs "}
                <span className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}>
                  <span
                    className={styles.swatch}
                    style={{ background: colourToHex(teamColour(teams, match.teamBId)) }}
                  />{" "}
                  {teamName(teams, match.teamBId)}
                </span>
                {match.status === "COMPLETED" && (
                  <span>
                    {" "}
                    {match.winnerTeamId === null
                      ? "(Draw)"
                      : `(${match.teamAScore ?? "-"} - ${match.teamBScore ?? "-"})`}
                  </span>
                )}
              </div>
            ))}
          </>
        )}

        {rounds.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Knockout Bracket</h2>
            {rounds.map((round) => (
              <div key={round}>
                <h4 style={{ color: "var(--color-text-muted)", margin: "16px 0 6px" }}>
                  {ROUND_LABELS[round] ?? round}
                </h4>
                {knockoutMatches
                  .filter((m) => m.round === round)
                  .map((match) => (
                    <div key={match.id} className={styles.matchRow}>
                      <span className={match.winnerTeamId === match.teamAId ? styles.winnerName : ""}>
                        {teamName(teams, match.teamAId)}
                      </span>
                      {match.teamBId ? (
                        <>
                          {" vs "}
                          <span className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}>
                            {teamName(teams, match.teamBId)}
                          </span>
                        </>
                      ) : (
                        " (bye)"
                      )}
                      {match.status === "COMPLETED" && match.teamBId && (
                        <span>
                          {" "}
                          ({match.teamAScore ?? "-"} - {match.teamBScore ?? "-"})
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
