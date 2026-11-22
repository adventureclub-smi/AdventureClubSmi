"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";

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

function teamColour(teams: Team[], id: string | null): string {
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

  async function handleGuestRegister() {
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
    return <div className={styles.container}>Loading...</div>;
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

  return (
    <div className={styles.container}>
      {event.coverImage && (
        <div className={styles.cover}>
          <Image src={event.coverImage} alt={event.title} fill style={{ objectFit: "cover" }} />
        </div>
      )}

      <h1>{event.title}</h1>

      <div className={styles.meta}>
        <span>
          <MapPin size={15} /> {event.destination}
        </span>
        <span>
          <CalendarDays size={15} /> {new Date(event.date).toLocaleDateString()}
        </span>
        {event.eventTeamSize && (
          <span>
            <Users size={15} /> Teams of {event.eventTeamSize}
          </span>
        )}
        {spotsLeft !== null && <span>{spotsLeft} spots left</span>}
      </div>

      <p className={styles.description}>{event.description}</p>

      {isRegistered && (
        <div className={`${styles.card} ${styles.qrCard}`}>
          <div className={styles.qrRow}>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Check-in QR code" className={styles.qrImage} />
            )}
            <div>
              <span className={styles.qrLabel}>Your registration number</span>
              <div className={styles.qrCode}>{myShortCode}</div>
              {myAttendanceMarked ? (
                <p className={styles.checkedInTag}>
                  <CheckCircle2 size={16} /> Checked in on event day
                </p>
              ) : (
                <p className={styles.qrHint}>
                  Show this QR (or just give your number) at the check-in desk on event day.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {guestConfirmation && (
        <div className={`${styles.card} ${styles.qrCard}`}>
          <div className={styles.qrRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guestConfirmation.qrDataUrl} alt="Check-in QR code" className={styles.qrImage} />
            <div>
              <span className={styles.qrLabel}>Your registration number</span>
              <div className={styles.qrCode}>{guestConfirmation.shortCode}</div>
              <p className={styles.qrHint}>
                Screenshot this now — as a guest, this page can&apos;t look it back up for you later.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        {myTeam ? (
          <>
            <h3>
              <span className={styles.swatch} style={{ background: colourToHex(myTeam.colour) }} />
              Your Team: {myTeam.name}
            </h3>
            <ul className={styles.teamList}>
              {myTeam.members.map((name, i) => (
                <li key={`${name}-${i}`}>{name}</li>
              ))}
            </ul>
          </>
        ) : isRegistered || guestConfirmation ? (
          <p>You&apos;re registered! Teams are formed physically on the day — show up and pick your chit.</p>
        ) : event.eventTeamsDrawnAt ? (
          <p>Team allocation has already started — registration for this event is closed.</p>
        ) : registrationState !== "OPEN" ? (
          <p>
            {registrationState === "NOT_OPEN"
              ? "Registration hasn't opened yet."
              : "Registration is closed."}
          </p>
        ) : (
          <>
            <h3>Register</h3>
            <p className={styles.qrHint} style={{ marginBottom: 14 }}>
              Come alone — no need to register with a group or find a team beforehand. Teams are
              formed on the day by picking a chit from a bag.
            </p>

            {loggedIn && (
              <button className={styles.submitButton} disabled={submitting} onClick={handleRegister}>
                {submitting ? "Registering..." : "Register"}
              </button>
            )}

            {!guestMode ? (
              <button
                type="button"
                className={styles.guestToggle}
                onClick={() => setGuestMode(true)}
              >
                {loggedIn
                  ? "Registering someone without a club account? Register as a guest"
                  : "Don't have a club account? Register as a guest"}
              </button>
            ) : (
              <div style={{ marginTop: loggedIn ? 16 : 0 }}>
                <label className={styles.field}>
                  <span>Full name</span>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>Phone number</span>
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>College / organisation (optional)</span>
                  <input value={guestCollege} onChange={(e) => setGuestCollege(e.target.value)} />
                </label>
                <button
                  className={styles.submitButton}
                  disabled={submitting}
                  onClick={handleGuestRegister}
                >
                  {submitting ? "Registering..." : "Register as Guest"}
                </button>
              </div>
            )}
          </>
        )}

        {message && (
          <p className={`${styles.status} ${message.error ? styles.statusError : ""}`}>
            {message.text}
          </p>
        )}
      </div>

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
                      <span
                        className={styles.swatch}
                        style={{ background: colourToHex(row.teamColour) }}
                      />
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
                />
                {teamName(teams, match.teamAId)}
              </span>
              {" vs "}
              <span className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}>
                <span
                  className={styles.swatch}
                  style={{ background: colourToHex(teamColour(teams, match.teamBId)) }}
                />
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
              <h4>{ROUND_LABELS[round] ?? round}</h4>
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
                        <span
                          className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}
                        >
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
  );
}
