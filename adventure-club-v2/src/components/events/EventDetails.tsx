"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";

import { registrationStateFor } from "@/lib/registration-journey";
import styles from "./EventDetails.module.scss";

type Team = { id: string; name: string; groupNumber: number | null };

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
  played: number;
  won: number;
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
  isRegistered: boolean;
  myShortCode: string | null;
  myAttendanceMarked: boolean;
  myTeam: { id: string; name: string; members: string[] } | null;
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

export default function EventDetails({ eventId }: { eventId: string }) {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState("");
  const [buddyClubId, setBuddyClubId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

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
      body: JSON.stringify({ gender: gender || undefined, buddyClubId: buddyClubId || undefined }),
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

  if (loading || !data) {
    return <div className={styles.container}>Loading...</div>;
  }

  const {
    event,
    registeredCount,
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

      <div className={styles.card}>
        {myTeam ? (
          <>
            <h3>Your Team: {myTeam.name}</h3>
            <ul className={styles.teamList}>
              {myTeam.members.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </>
        ) : isRegistered ? (
          <p>You&apos;re registered! Teams will be announced once registration closes.</p>
        ) : event.eventTeamsDrawnAt ? (
          <p>Teams have already been drawn — registration for this event is closed.</p>
        ) : registrationState !== "OPEN" ? (
          <p>
            {registrationState === "NOT_OPEN"
              ? "Registration hasn't opened yet."
              : "Registration is closed."}
          </p>
        ) : (
          <>
            <h3>Register</h3>

            <label className={styles.field}>
              <span>Gender (optional — used only to balance teams fairly)</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Register with a friend (optional)</span>
              <input
                placeholder="Friend's Club ID"
                value={buddyClubId}
                onChange={(e) => setBuddyClubId(e.target.value)}
              />
            </label>

            <button className={styles.submitButton} disabled={submitting} onClick={handleRegister}>
              {submitting ? "Registering..." : "Register"}
            </button>
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
                  <th>L</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.teamId} className={row.qualified ? styles.qualifiedRow : ""}>
                    <td>{row.teamName}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
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
                {teamName(teams, match.teamAId)}
              </span>
              {" vs "}
              <span className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}>
                {teamName(teams, match.teamBId)}
              </span>
              {match.status === "COMPLETED" && (
                <span>
                  {" "}
                  ({match.teamAScore ?? "-"} - {match.teamBScore ?? "-"})
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
