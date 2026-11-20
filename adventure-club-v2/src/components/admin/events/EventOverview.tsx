"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, CheckCircle2, Undo2, ScanLine } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import AddEventParticipantModal from "./AddEventParticipantModal";
import QrScannerModal from "./QrScannerModal";
import styles from "./EventOverview.module.scss";

type Registration = {
  id: string;
  gender: string | null;
  buddyRequestUserId: string | null;
  teamId: string | null;
  shortCode: string;
  attendanceMarked: boolean;
  attendanceMarkedAt: string | null;
  user: { id: string; fullName: string; clubId: string };
};

type Team = {
  id: string;
  name: string;
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
  played: number;
  won: number;
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
  { key: "draw", label: "Draw Teams" },
  { key: "fixtures", label: "Fixtures & Results" },
  { key: "points", label: "Points Table" },
  { key: "bracket", label: "Knockout Bracket" },
  { key: "checkin", label: "Check-In" },
] as const;

function teamName(teams: Team[], id: string | null) {
  if (!id) return "—";
  return teams.find((t) => t.id === id)?.name ?? "Unknown Team";
}

function ResultForm({
  match,
  teams,
  onSubmit,
}: {
  match: Match;
  teams: Team[];
  onSubmit: (winnerTeamId: string, teamAScore: string, teamBScore: string) => void;
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
      </select>
      <button
        type="button"
        className={styles.secondaryButton}
        disabled={!winner}
        onClick={() => onSubmit(winner, scoreA, scoreB)}
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

  async function handleDraw() {
    setActing(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventId}/draw`, { method: "POST" });
    const json = await res.json().catch(() => null);

    setActing(false);

    if (!res.ok) {
      setMessage({ text: json?.message || "Failed to draw teams.", error: true });
      return;
    }

    setMessage({ text: json.message });
    load();
  }

  async function handleRecordResult(
    matchId: string,
    winnerTeamId: string,
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
          <button className={styles.deleteButton} disabled={deleting} onClick={handleDelete}>
            <Trash2 size={15} /> {deleting ? "Deleting..." : "Delete Event"}
          </button>
        }
      />

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
          <span>Players / team</span>
          <strong>{event.eventTeamSize ?? "—"}</strong>
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
          {!event.eventTeamsDrawnAt && (
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
                <th>Club ID</th>
                <th>Gender</th>
                <th>Buddy request</th>
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
                  <td data-label="Name">{r.user.fullName}</td>
                  <td data-label="Club ID">{r.user.clubId}</td>
                  <td data-label="Gender">{r.gender ?? "—"}</td>
                  <td data-label="Buddy request">
                    {r.buddyRequestUserId
                      ? registrations.find((other) => other.user.id === r.buddyRequestUserId)?.user
                          .fullName ?? "—"
                      : "—"}
                  </td>
                  <td data-label="Team">{r.teamId ? teamName(teams, r.teamId) : "—"}</td>
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
                  <td colSpan={7}>No one has registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {tab === "draw" && (
        <div>
          <p>
            {event.eventTeamsDrawnAt
              ? `Teams were drawn on ${new Date(event.eventTeamsDrawnAt).toLocaleString()}. Redrawing is only possible if no match has been played yet.`
              : "Draw teams once registration has closed and the roster is final."}
          </p>

          <button
            className={styles.primaryButton}
            disabled={acting}
            onClick={handleDraw}
            style={{ margin: "14px 0 24px" }}
          >
            {acting ? "Drawing..." : event.eventTeamsDrawnAt ? "Redraw Teams" : "Draw Teams"}
          </button>

          {Array.from(new Set(teams.map((t) => t.groupNumber))).map((groupNumber) => (
            <div key={String(groupNumber)}>
              {groupNumber !== null && <h3 className={styles.groupLabel}>Group {groupNumber}</h3>}
              <div className={styles.teamGrid}>
                {teams
                  .filter((t) => t.groupNumber === groupNumber)
                  .map((team) => (
                    <div key={team.id} className={styles.teamCard}>
                      <h3>{team.name}</h3>
                      <ul>
                        {registrations
                          .filter((r) => r.teamId === team.id)
                          .map((r) => (
                            <li key={r.id}>{r.user.fullName}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "fixtures" && (
        <div>
          {groupMatches.length === 0 ? (
            <p>Draw teams first to generate fixtures.</p>
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
                          {teamName(teams, match.teamAId)}
                        </span>
                        <span className={styles.vs}>vs</span>
                        <span
                          className={match.winnerTeamId === match.teamBId ? styles.winnerName : ""}
                        >
                          {teamName(teams, match.teamBId)}
                        </span>
                        {match.status === "COMPLETED" && (
                          <span className={styles.scoreTag}>
                            {match.teamAScore ?? "–"} – {match.teamBScore ?? "–"}
                          </span>
                        )}
                      </div>

                      {match.status !== "COMPLETED" && (
                        <ResultForm
                          match={match}
                          teams={teams}
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
            <p>Draw teams first to see the points table.</p>
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
                      <th>Lost</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.teamId}>
                        <td data-label="Team">
                          {row.teamName}
                          {row.qualified && <span className={styles.qualifiedTag}>Qualified</span>}
                        </td>
                        <td className={styles.num} data-label="Played">
                          {row.played}
                        </td>
                        <td className={styles.num} data-label="Won">
                          {row.won}
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
              ? groupStageComplete
                ? "Group stage is complete — generate the knockout bracket."
                : "Finish every group-stage match before generating the bracket."
              : "Click Advance once every match in the current round is complete."}
          </p>

          <button
            className={styles.primaryButton}
            disabled={acting || (knockoutMatches.length === 0 && !groupStageComplete)}
            onClick={handleAdvanceBracket}
            style={{ margin: "14px 0 28px" }}
          >
            {acting
              ? "Working..."
              : knockoutMatches.length === 0
              ? "Generate Bracket"
              : "Advance Bracket"}
          </button>

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
                          <span>{teamName(teams, match.teamAId)}</span>
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
                            <span>{teamName(teams, match.teamBId)}</span>
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
                  <th>Club ID</th>
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
                    <td data-label="Name">{r.user.fullName}</td>
                    <td data-label="Club ID">{r.user.clubId}</td>
                    <td data-label="Team">{r.teamId ? teamName(teams, r.teamId) : "—"}</td>
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
