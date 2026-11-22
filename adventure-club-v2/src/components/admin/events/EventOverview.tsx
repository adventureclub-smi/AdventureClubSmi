"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Trash2, UserPlus, CheckCircle2, Undo2, ScanLine, QrCode, Printer } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import AddEventParticipantModal from "./AddEventParticipantModal";
import QrScannerModal from "./QrScannerModal";
import { colourToHex } from "@/lib/team-colours";
import styles from "./EventOverview.module.scss";

type Registration = {
  id: string;
  isGuest: boolean;
  guestName: string | null;
  guestPhone: string | null;
  teamId: string | null;
  shortCode: string;
  attendanceMarked: boolean;
  attendanceMarkedAt: string | null;
  user: { id: string; fullName: string; clubId: string } | null;
};

function regName(r: Registration) {
  return r.user?.fullName ?? r.guestName ?? "Guest";
}

function regIdentifier(r: Registration) {
  return r.user?.clubId ?? r.guestPhone ?? "—";
}

type Team = {
  id: string;
  name: string;
  colour: string;
  targetSize: number;
  groupNumber: number | null;
};

type Match = {
  id: string;
  stage: string;
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

type Overview = {
  event: {
    id: string;
    title: string;
    destination: string;
    date: string;
    seats: number;
    eventTeamSize: number | null;
    eventQualifiersCount: number | null;
    eventMatchesPerTeamCap: number | null;
    eventFormat: string;
    eventTeamsDrawnAt: string | null;
  };
  registrations: Registration[];
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

const TABS = [
  { key: "registrations", label: "Registrations" },
  { key: "teams", label: "Team Allocation" },
  { key: "fixtures", label: "Fixtures & Results" },
  { key: "points", label: "Points Table" },
  { key: "bracket", label: "Knockout Bracket" },
  { key: "checkin", label: "Check-In" },
] as const;

function teamOf(teams: Team[], id: string | null) {
  if (!id) return null;
  return teams.find((t) => t.id === id) ?? null;
}

function teamName(teams: Team[], id: string | null) {
  return teamOf(teams, id)?.name ?? (id ? "Unknown Team" : "—");
}

function TeamLabel({ team }: { team: Team | null }) {
  if (!team) return <span>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span className={styles.swatch} style={{ background: colourToHex(team.colour) }} />
      {team.name}
    </span>
  );
}

function ResultForm({
  match,
  teams,
  allowDraw,
  onSubmit,
}: {
  match: Match;
  teams: Team[];
  allowDraw: boolean;
  onSubmit: (winnerTeamId: string | null, teamAScore: string, teamBScore: string) => void;
}) {
  const [winner, setWinner] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  if (!match.teamBId) {
    return <span className={styles.byeTag}>Bye</span>;
  }

  return (
    <div className={styles.resultForm}>
      <input placeholder="A" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
      <input placeholder="B" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
      <select value={winner} onChange={(e) => setWinner(e.target.value)}>
        <option value="">Winner...</option>
        <option value={match.teamAId}>{teamName(teams, match.teamAId)}</option>
        <option value={match.teamBId}>{teamName(teams, match.teamBId)}</option>
        {allowDraw && <option value="DRAW">Draw</option>}
      </select>
      <button
        type="button"
        className={styles.secondaryButton}
        disabled={!winner}
        onClick={() => onSubmit(winner === "DRAW" ? null : winner, scoreA, scoreB)}
      >
        Save
      </button>
    </div>
  );
}

export default function EventOverview({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("registrations");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [acting, setActing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkinQuery, setCheckinQuery] = useState("");
  const [checkinResults, setCheckinResults] = useState<Registration[] | null>(null);
  const [checkinSearching, setCheckinSearching] = useState(false);

  // Tournament settings (decided later, once attendance is known)
  const [tsTeamSize, setTsTeamSize] = useState("");
  const [tsFormat, setTsFormat] = useState<"LEAGUE_KNOCKOUT" | "DIRECT_KNOCKOUT">("LEAGUE_KNOCKOUT");
  const [tsQualifiers, setTsQualifiers] = useState<"4" | "6">("4");
  const [tsMatchCap, setTsMatchCap] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoadedFor, setSettingsLoadedFor] = useState("");

  // Team setup (pre-lock)
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColour, setNewTeamColour] = useState("");
  const [newTeamTarget, setNewTeamTarget] = useState("8");
  const [assignQuery, setAssignQuery] = useState("");
  const [assignResults, setAssignResults] = useState<Registration[] | null>(null);
  const [assignSearching, setAssignSearching] = useState(false);
  const [locking, setLocking] = useState(false);

  // Registration QR poster
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/overview`);
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
        const res = await fetch(`/api/events/${eventId}/overview`);
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

  // Sync the tournament-settings form from the fetched event once per
  // load of this event — but only once, so a subsequent `load()` (e.g.
  // after assigning someone to a team) doesn't clobber an in-progress edit.
  useEffect(() => {
    if (!data || settingsLoadedFor === data.event.id) return;

    setTsTeamSize(data.event.eventTeamSize ? String(data.event.eventTeamSize) : "");
    setTsFormat(data.event.eventFormat === "DIRECT_KNOCKOUT" ? "DIRECT_KNOCKOUT" : "LEAGUE_KNOCKOUT");
    setTsQualifiers(data.event.eventQualifiersCount === 6 ? "6" : "4");
    setTsMatchCap(data.event.eventMatchesPerTeamCap ? String(data.event.eventMatchesPerTeamCap) : "");
    setSettingsLoadedFor(data.event.id);
  }, [data, settingsLoadedFor]);

  async function handleSaveTournamentSettings() {
    setSavingSettings(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/tournament-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamSize: tsTeamSize || undefined,
        eventFormat: tsFormat,
        qualifiersCount: tsFormat === "LEAGUE_KNOCKOUT" ? tsQualifiers : undefined,
        matchesPerTeamCap: tsFormat === "LEAGUE_KNOCKOUT" ? tsMatchCap || undefined : undefined,
      }),
    });

    const json = await res.json().catch(() => null);
    setSavingSettings(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to save tournament settings.", error: true });
      return;
    }

    setMessage({ text: json.message });
    load();
  }

  async function handleRecordResult(
    matchId: string,
    winnerTeamId: string | null,
    teamAScore: string,
    teamBScore: string
  ) {
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winnerTeamId,
        teamAScore: teamAScore || undefined,
        teamBScore: teamBScore || undefined,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to record result.", error: true });
      return;
    }

    load();
  }

  async function handleAdvanceBracket() {
    setActing(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/bracket`, { method: "POST" });
    const json = await res.json().catch(() => null);

    setActing(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to advance bracket.", error: true });
      return;
    }

    setMessage({ text: json.message });
    load();
  }

  useEffect(() => {
    if (!checkinQuery.trim()) {
      setCheckinResults(null);
      return;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      setCheckinSearching(true);
      try {
        const res = await fetch(
          `/api/events/${eventId}/checkin?query=${encodeURIComponent(checkinQuery)}`
        );
        const json = await res.json();
        if (active) setCheckinResults(json.registrations ?? []);
      } finally {
        if (active) setCheckinSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [checkinQuery, eventId]);

  async function handleToggleCheckin(registrationId: string, present: boolean) {
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, present }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to update check-in.", error: true });
      return;
    }

    setMessage({ text: json.message });
    setCheckinResults(
      (prev) => prev?.map((r) => (r.id === registrationId ? json.registration : r)) ?? null
    );
    load();
  }

  // ===== Team Allocation (physical chit picking) =====

  useEffect(() => {
    if (!assignQuery.trim()) {
      setAssignResults(null);
      return;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      setAssignSearching(true);
      try {
        const res = await fetch(
          `/api/events/${eventId}/checkin?query=${encodeURIComponent(assignQuery)}`
        );
        const json = await res.json();
        if (active) setAssignResults(json.registrations ?? []);
      } finally {
        if (active) setAssignSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [assignQuery, eventId]);

  async function handleCreateTeam() {
    if (!newTeamName.trim() || !newTeamColour.trim()) {
      setMessage({ text: "Team name and colour are required.", error: true });
      return;
    }

    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTeamName,
        colour: newTeamColour,
        targetSize: newTeamTarget ? Number(newTeamTarget) : 0,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to create team.", error: true });
      return;
    }

    setNewTeamName("");
    setNewTeamColour("");
    load();
  }

  async function handleDeleteTeam(teamId: string) {
    const confirmed = confirm("Delete this team? Only possible if nobody is recorded onto it.");
    if (!confirmed) return;

    const res = await fetch(`/api/events/${eventId}/teams/${teamId}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to delete team.", error: true });
      return;
    }

    load();
  }

  async function handleAssign(registrationId: string, teamId: string | null) {
    const res = await fetch(`/api/events/${eventId}/teams/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, teamId }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to record allocation.", error: true });
      return;
    }

    setAssignResults(
      (prev) => prev?.map((r) => (r.id === registrationId ? json.registration : r)) ?? null
    );
    load();
  }

  async function handleLockTeams() {
    const confirmed = confirm(
      "Lock teams and generate fixtures? No further allocation changes or registrations will be possible after this."
    );
    if (!confirmed) return;

    setLocking(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/lock-teams`, { method: "POST" });
    const json = await res.json().catch(() => null);

    setLocking(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to lock teams.", error: true });
      return;
    }

    setMessage({ text: json.message });
    load();
  }

  async function openQr() {
    const url = `${window.location.origin}/events/${eventId}`;
    setRegistrationUrl(url);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: "#0d0d0d", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
    setQrOpen(true);
  }

  async function handleDelete() {
    if (!data) return;

    const confirmed = confirm(
      `Delete "${data.event.title}"? This removes all its registrations, teams and matches too — this can't be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);

    const res = await fetch(`/api/treks/${eventId}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setDeleting(false);
      setMessage({ text: json?.message || "Failed to delete event.", error: true });
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  if (loading || !data) {
    return (
      <div className={styles.container}>
        <p>Loading event...</p>
      </div>
    );
  }

  const { event, registrations, teams, groupMatches, knockoutMatches, standings } = data;

  const groupStageComplete =
    groupMatches.length > 0 && groupMatches.every((m) => m.status === "COMPLETED");

  const rounds = Array.from(new Set(knockoutMatches.map((m) => m.round ?? "")));
  const presentCount = registrations.filter((r) => r.attendanceMarked).length;
  const unassignedCount = registrations.filter((r) => !r.teamId).length;
  const isLocked = !!event.eventTeamsDrawnAt;

  return (
    <div className={styles.container}>
      <PageHeader
        title={event.title}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Campus Events", href: "/admin/events" },
          { label: event.title },
        ]}
        quickActions={
          <div style={{ display: "flex", gap: 10 }}>
            <button className={styles.secondaryButton} onClick={openQr}>
              <QrCode size={14} /> Registration QR
            </button>
            <button className={styles.deleteButton} disabled={deleting} onClick={handleDelete}>
              <Trash2 size={15} /> {deleting ? "Deleting..." : "Delete Event"}
            </button>
          </div>
        }
      />

      {qrOpen && (
        <div className={styles.modalOverlay} onClick={() => setQrOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>Scan to Register</h3>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Registration QR code" />
            )}
            <p>{registrationUrl}</p>
            <a href={qrDataUrl} download={`${event.title}-registration-qr.png`}>
              <button className={styles.primaryButton} style={{ width: "100%" }}>
                Download
              </button>
            </a>
          </div>
        </div>
      )}

      <AddEventParticipantModal
        eventId={eventId}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={load}
      />

      <QrScannerModal
        eventId={eventId}
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onMarked={load}
      />

      <div className={styles.kpiStrip}>
        <div className={styles.kpi}>
          <span>Registered</span>
          <strong>{registrations.length}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Teams</span>
          <strong>{teams.length || "—"}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Format</span>
          <strong style={{ fontSize: 15 }}>
            {event.eventFormat === "DIRECT_KNOCKOUT" ? "Direct Knockout" : "League + Knockout"}
          </strong>
        </div>
        <div className={styles.kpi}>
          <span>Qualify for knockout</span>
          <strong>{event.eventQualifiersCount ?? "—"}</strong>
        </div>
      </div>

      {message && (
        <p className={`${styles.status} ${message.error ? styles.statusError : ""}`}>
          {message.text}
        </p>
      )}

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "registrations" && (
        <>
          {!isLocked && (
            <button
              className={styles.primaryButton}
              style={{ marginBottom: 16 }}
              onClick={() => setAddModalOpen(true)}
            >
              <UserPlus size={15} /> Add Participant
            </button>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Club ID / Phone</th>
                <th>Team</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td data-label="Code" className={styles.num}>
                    {r.shortCode}
                  </td>
                  <td data-label="Name">
                    {regName(r)} {r.isGuest && <span className={styles.byeTag}>(guest)</span>}
                  </td>
                  <td data-label="Club ID / Phone">{regIdentifier(r)}</td>
                  <td data-label="Team">
                    <TeamLabel team={teamOf(teams, r.teamId)} />
                  </td>
                  <td data-label="Present">
                    {r.attendanceMarked ? (
                      <span className={styles.qualifiedTag}>Present</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={5}>No one has registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {tab === "teams" && (
        <div>
          <p>
            Teams are formed physically — a chit per participant, drawn from a bag. This page
            only helps print the right number of chits per team and records the result once
            picked. It never decides anyone&apos;s team.
          </p>

          {isLocked ? (
            <>
              <p style={{ marginTop: 8 }}>
                Teams were locked on {new Date(event.eventTeamsDrawnAt!).toLocaleString()}.
              </p>

              {Array.from(new Set(teams.map((t) => t.groupNumber))).map((groupNumber) => (
                <div key={String(groupNumber)}>
                  {groupNumber !== null && <h3 className={styles.groupLabel}>Group {groupNumber}</h3>}
                  <div className={styles.teamGrid}>
                    {teams
                      .filter((t) => t.groupNumber === groupNumber)
                      .map((team) => (
                        <div key={team.id} className={styles.teamCard}>
                          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              className={styles.swatch}
                              style={{ background: colourToHex(team.colour) }}
                            />
                            {team.name}
                          </h3>
                          <ul>
                            {registrations
                              .filter((r) => r.teamId === team.id)
                              .map((r) => (
                                <li key={r.id}>{regName(r)}</li>
                              ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className={styles.sectionLabel} style={{ marginTop: 20, marginBottom: 8 }}>
                0. Tournament settings
              </div>
              <p style={{ marginBottom: 12 }}>
                Decide these once you know who actually showed up — there&apos;s no need to guess at
                event creation.
              </p>

              <div className={styles.teamSetupForm}>
                <input
                  type="number"
                  min={1}
                  placeholder="Target players / team"
                  value={tsTeamSize}
                  onChange={(e) => setTsTeamSize(e.target.value)}
                  style={{ width: 170 }}
                />
                <select value={tsFormat} onChange={(e) => setTsFormat(e.target.value as typeof tsFormat)}>
                  <option value="LEAGUE_KNOCKOUT">League + Knockout</option>
                  <option value="DIRECT_KNOCKOUT">Direct Knockout</option>
                </select>
                {tsFormat === "LEAGUE_KNOCKOUT" && (
                  <>
                    <select value={tsQualifiers} onChange={(e) => setTsQualifiers(e.target.value as typeof tsQualifiers)}>
                      <option value="4">Top 4 qualify</option>
                      <option value="6">Top 6 qualify</option>
                    </select>
                    <input
                      type="number"
                      min={2}
                      placeholder="Max matches / team (blank = all play all)"
                      value={tsMatchCap}
                      onChange={(e) => setTsMatchCap(e.target.value)}
                      style={{ width: 230 }}
                    />
                  </>
                )}
                <button
                  className={styles.primaryButton}
                  disabled={savingSettings}
                  onClick={handleSaveTournamentSettings}
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>

              <a
                href={`/admin/events/${eventId}/chits`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", margin: "12px 0 20px" }}
              >
                <button className={styles.secondaryButton} type="button">
                  <Printer size={14} /> Print Chits
                </button>
              </a>

              <div className={styles.sectionLabel} style={{ marginBottom: 8 }}>
                1. Create teams
              </div>

              <div className={styles.teamSetupForm}>
                <input
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <input
                  placeholder="Colour (e.g. Red)"
                  value={newTeamColour}
                  onChange={(e) => setNewTeamColour(e.target.value)}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Chits to print"
                  value={newTeamTarget}
                  onChange={(e) => setNewTeamTarget(e.target.value)}
                  style={{ width: 120 }}
                />
                <button className={styles.primaryButton} onClick={handleCreateTeam}>
                  Add Team
                </button>
              </div>

              {teams.map((team) => {
                const assignedCount = registrations.filter((r) => r.teamId === team.id).length;
                return (
                  <div key={team.id} className={styles.teamSetupCard}>
                    <span className={styles.swatch} style={{ background: colourToHex(team.colour) }} />
                    <strong>{team.name}</strong>
                    <span>
                      {assignedCount} / {team.targetSize || "?"} assigned
                    </span>
                    <button
                      className={styles.secondaryButton}
                      disabled={assignedCount > 0}
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              <div className={styles.sectionLabel} style={{ margin: "24px 0 8px" }}>
                2. Record each participant&apos;s chit
              </div>

              {unassignedCount > 0 && (
                <p className={styles.unassignedBanner}>
                  {unassignedCount} registered participant(s) have no recorded team yet.
                </p>
              )}

              <input
                className={styles.checkinSearch}
                placeholder="Search by code, name or Club ID"
                value={assignQuery}
                onChange={(e) => setAssignQuery(e.target.value)}
              />

              {assignSearching && <p>Searching...</p>}

              {assignResults?.map((r) => (
                <div key={r.id} className={styles.assignRow}>
                  <span className={styles.assignName}>
                    {r.shortCode} · {regName(r)}
                  </span>
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      className={`${styles.teamPill} ${r.teamId === team.id ? styles.activePill : ""}`}
                      disabled={teams.length === 0}
                      onClick={() => handleAssign(r.id, r.teamId === team.id ? null : team.id)}
                    >
                      <span className={styles.swatch} style={{ background: colourToHex(team.colour) }} />
                      {team.name}
                    </button>
                  ))}
                </div>
              ))}
              {assignResults && assignResults.length === 0 && <p>No match.</p>}

              <button
                className={styles.primaryButton}
                style={{ marginTop: 24 }}
                disabled={locking || teams.length < 2 || unassignedCount > 0 || registrations.length === 0}
                onClick={handleLockTeams}
              >
                {locking ? "Locking..." : "Lock Teams & Generate Fixtures"}
              </button>
            </>
          )}
        </div>
      )}

      {tab === "fixtures" && (
        <div>
          {groupMatches.length === 0 ? (
            <p>Lock teams first to generate fixtures.</p>
          ) : (
            Array.from(new Set(groupMatches.map((m) => m.groupNumber))).map((groupNumber) => (
              <div key={String(groupNumber)}>
                <h3 className={styles.groupLabel}>
                  {groupNumber ? `Group ${groupNumber}` : "Fixtures"}
                </h3>
                {groupMatches
                  .filter((m) => m.groupNumber === groupNumber)
                  .map((match) => (
                    <div key={match.id} className={styles.matchRow}>
                      <div className={styles.matchTeams}>
                        <span
                          className={match.winnerTeamId === match.teamAId ? styles.winnerName : ""}
                        >
                          <TeamLabel team={teamOf(teams, match.teamAId)} />
                        </span>
                        <span className={styles.vs}>vs</span>
                        <span
                          className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}
                        >
                          <TeamLabel team={teamOf(teams, match.teamBId)} />
                        </span>
                        {match.status === "COMPLETED" && (
                          <span className={styles.scoreTag}>
                            {match.winnerTeamId === null
                              ? "Draw"
                              : `${match.teamAScore ?? "–"} – ${match.teamBScore ?? "–"}`}
                          </span>
                        )}
                      </div>

                      {match.status !== "COMPLETED" && (
                        <ResultForm
                          match={match}
                          teams={teams}
                          allowDraw
                          onSubmit={(winnerTeamId, a, b) =>
                            handleRecordResult(match.id, winnerTeamId, a, b)
                          }
                        />
                      )}
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "points" && (
        <div>
          {standings.length === 0 ? (
            <p>Lock teams first to see the points table.</p>
          ) : (
            standings.map((group) => (
              <div key={String(group.groupNumber)}>
                <h3 className={styles.groupLabel}>
                  {group.groupNumber ? `Group ${group.groupNumber}` : "Points Table"}
                </h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Played</th>
                      <th>Won</th>
                      <th>Drawn</th>
                      <th>Lost</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.teamId}>
                        <td data-label="Team">
                          <span className={styles.swatch} style={{ background: colourToHex(row.teamColour) }} />{" "}
                          {row.teamName}
                          {row.qualified && <span className={styles.qualifiedTag}>Qualified</span>}
                        </td>
                        <td className={styles.num} data-label="Played">
                          {row.played}
                        </td>
                        <td className={styles.num} data-label="Won">
                          {row.won}
                        </td>
                        <td className={styles.num} data-label="Drawn">
                          {row.drawn}
                        </td>
                        <td className={styles.num} data-label="Lost">
                          {row.lost}
                        </td>
                        <td className={styles.num} data-label="Points">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "bracket" && (
        <div>
          <p>
            {knockoutMatches.length === 0
              ? event.eventFormat === "DIRECT_KNOCKOUT"
                ? "Lock teams to generate the knockout bracket directly."
                : groupStageComplete
                ? "Group stage is complete — generate the knockout bracket."
                : "Finish every group-stage match before generating the bracket."
              : "Click Advance once every match in the current round is complete."}
          </p>

          {knockoutMatches.length === 0 && event.eventFormat === "LEAGUE_KNOCKOUT" && (
            <button
              className={styles.primaryButton}
              disabled={acting || !groupStageComplete}
              onClick={handleAdvanceBracket}
              style={{ margin: "14px 0 28px" }}
            >
              {acting ? "Working..." : "Generate Bracket"}
            </button>
          )}

          {knockoutMatches.length > 0 && (
            <button
              className={styles.primaryButton}
              disabled={acting}
              onClick={handleAdvanceBracket}
              style={{ margin: "14px 0 28px" }}
            >
              {acting ? "Working..." : "Advance Bracket"}
            </button>
          )}

          {rounds.length > 0 && (
            <div className={styles.bracket}>
              {rounds.map((round) => (
                <div key={round} className={styles.bracketRound}>
                  <h3>{ROUND_LABELS[round] ?? round}</h3>
                  {knockoutMatches
                    .filter((m) => m.round === round)
                    .map((match) => (
                      <div key={match.id} className={styles.bracketMatch}>
                        <div
                          className={`${styles.bracketTeam} ${
                            match.winnerTeamId === match.teamAId ? styles.winner : ""
                          }`}
                        >
                          <TeamLabel team={teamOf(teams, match.teamAId)} />
                          {match.status === "COMPLETED" && match.teamBId && (
                            <span>{match.teamAScore ?? ""}</span>
                          )}
                        </div>

                        {match.teamBId ? (
                          <div
                            className={`${styles.bracketTeam} ${
                              match.winnerTeamId === match.teamBId ? styles.winner : ""
                            }`}
                          >
                            <TeamLabel team={teamOf(teams, match.teamBId)} />
                            {match.status === "COMPLETED" && <span>{match.teamBScore ?? ""}</span>}
                          </div>
                        ) : (
                          <span className={styles.byeTag}>Bye</span>
                        )}

                        {match.status !== "COMPLETED" && match.teamBId && (
                          <div style={{ marginTop: 8 }}>
                            <ResultForm
                              match={match}
                              teams={teams}
                              allowDraw={false}
                              onSubmit={(winnerTeamId, a, b) =>
                                handleRecordResult(match.id, winnerTeamId, a, b)
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "checkin" && (
        <div>
          <p>{presentCount} / {registrations.length} checked in.</p>

          <button
            className={styles.primaryButton}
            style={{ margin: "12px 0" }}
            onClick={() => setScannerOpen(true)}
          >
            <ScanLine size={16} /> Scan QR
          </button>

          <p className={styles.checkinHint}>
            Or type a code / search by name below — either works just as well as scanning.
          </p>

          <input
            className={styles.checkinSearch}
            placeholder="Enter code (e.g. 07) or search by name / Club ID"
            value={checkinQuery}
            onChange={(e) => setCheckinQuery(e.target.value)}
          />

          {checkinSearching && <p>Searching...</p>}

          {checkinResults && (
            <table className={styles.table} style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Club ID / Phone</th>
                  <th>Team</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {checkinResults.map((r) => (
                  <tr key={r.id}>
                    <td className={styles.num} data-label="Code">
                      {r.shortCode}
                    </td>
                    <td data-label="Name">{regName(r)}</td>
                    <td data-label="Club ID / Phone">{regIdentifier(r)}</td>
                    <td data-label="Team">
                      <TeamLabel team={teamOf(teams, r.teamId)} />
                    </td>
                    <td data-label="">
                      {r.attendanceMarked ? (
                        <button
                          className={styles.secondaryButton}
                          onClick={() => handleToggleCheckin(r.id, false)}
                        >
                          <Undo2 size={13} /> Undo
                        </button>
                      ) : (
                        <button
                          className={styles.primaryButton}
                          onClick={() => handleToggleCheckin(r.id, true)}
                        >
                          <CheckCircle2 size={14} /> Mark Present
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {checkinResults.length === 0 && (
                  <tr>
                    <td colSpan={5}>No match.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
