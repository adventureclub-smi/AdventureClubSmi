"use client";

import { useEffect, useState } from "react";
import { Vote, Plus, X, Crown, Send, Radio, Lock, RefreshCw } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import { ELECTABLE_POSITIONS, MULTI_SELECT_POSITIONS } from "@/lib/core-team-roles";
import styles from "./CoreTeamRestructure.module.scss";

type Election = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  roster: string[];
  positions: string[];
  createdAt: string;
  publishedAt: string | null;
  closedAt: string | null;
};

type ResultRow = {
  position: string;
  tally: { name: string; count: number }[];
  maxCount: number;
  winners: string[];
};

export default function CoreTeamRestructure({ isOrganizer }: { isOrganizer: boolean }) {
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [ballotCount, setBallotCount] = useState(0);
  const [myBallot, setMyBallot] = useState<Record<string, string | string[]>>({});
  const [status, setStatus] = useState("");

  // Draft-setup form state (Admin only)
  const [rosterDraft, setRosterDraft] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [positionsDraft, setPositionsDraft] = useState<string[]>(ELECTABLE_POSITIONS);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/admin/core-team");
      if (!res.ok) return;
      const data = await res.json();

      setElection(data.election);
      setResults(data.results ?? []);
      setBallotCount(data.ballotCount ?? 0);
      setMyBallot(data.myBallot ?? {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/core-team");
        if (!active || !res.ok) return;
        const data = await res.json();

        setElection(data.election);
        setResults(data.results ?? []);
        setBallotCount(data.ballotCount ?? 0);
        setMyBallot(data.myBallot ?? {});
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  function addRosterName() {
    const name = nameInput.trim();
    if (!name || rosterDraft.includes(name)) return;
    setRosterDraft([...rosterDraft, name]);
    setNameInput("");
  }

  function removeRosterName(name: string) {
    setRosterDraft(rosterDraft.filter((n) => n !== name));
  }

  function togglePosition(position: string) {
    setPositionsDraft((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  }

  async function handleCreateElection() {
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/core-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: rosterDraft, positions: positionsDraft }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to create election.");
        return;
      }

      setStatus("Election created as a draft.");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!election) return;
    if (!confirm("Publish this election? Every core team member will be able to vote.")) return;

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/core-team/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: election.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to publish.");
        return;
      }

      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!election) return;
    if (!confirm("Close this election? No further votes will be accepted.")) return;

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/core-team/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: election.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to close.");
        return;
      }

      load();
    } finally {
      setSaving(false);
    }
  }

  function handleStartNew() {
    setElection(null);
    setResults([]);
    setRosterDraft([]);
    setPositionsDraft(ELECTABLE_POSITIONS);
    setStatus("");
  }

  function handleSelect(position: string, name: string) {
    setMyBallot((prev) => ({ ...prev, [position]: name }));
  }

  function handleAddMulti(position: string, name: string) {
    setMyBallot((prev) => {
      const current = Array.isArray(prev[position]) ? (prev[position] as string[]) : [];
      return { ...prev, [position]: [...current, name] };
    });
  }

  function handleRemoveMulti(position: string, name: string) {
    setMyBallot((prev) => {
      const current = Array.isArray(prev[position]) ? (prev[position] as string[]) : [];
      return { ...prev, [position]: current.filter((n) => n !== name) };
    });
  }

  async function handleSubmitBallot() {
    if (!election) return;

    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/core-team/ballot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: election.id, selections: myBallot }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to submit ballot.");
        return;
      }

      setStatus("Your ballot has been submitted. You can come back and change it any time before the election closes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.hint}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Core Team Restructure"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Core Team Restructure" }]}
      />

      {status && <p className={styles.status}>{status}</p>}

      {isOrganizer ? (
        <>
          {!election && (
            <section className={styles.card}>
              <h2>
                <Vote size={18} /> Set Up a New Election
              </h2>

              <label className={styles.label}>Roster</label>
              <div className={styles.rosterInputRow}>
                <input
                  placeholder="Type a name and press Add"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRosterName();
                    }
                  }}
                />
                <button onClick={addRosterName} type="button">
                  <Plus size={14} /> Add
                </button>
              </div>

              {rosterDraft.length > 0 && (
                <div className={styles.chips}>
                  {rosterDraft.map((name) => (
                    <span key={name} className={styles.chip}>
                      {name}
                      <button type="button" onClick={() => removeRosterName(name)} aria-label={`Remove ${name}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <label className={styles.label}>Positions up for election</label>
              <div className={styles.chips}>
                {ELECTABLE_POSITIONS.map((position) => (
                  <button
                    key={position}
                    type="button"
                    className={
                      positionsDraft.includes(position) ? styles.positionChipActive : styles.positionChip
                    }
                    onClick={() => togglePosition(position)}
                  >
                    {position}
                  </button>
                ))}
              </div>

              <button
                className={styles.primaryButton}
                disabled={saving || rosterDraft.length === 0 || positionsDraft.length === 0}
                onClick={handleCreateElection}
              >
                {saving ? "Creating..." : "Create Election (Draft)"}
              </button>
            </section>
          )}

          {election && election.status === "DRAFT" && (
            <section className={styles.card}>
              <h2>
                <Lock size={18} /> Draft — Not Visible to Voters Yet
              </h2>

              <p className={styles.subtle}>Roster: {election.roster.join(", ")}</p>
              <p className={styles.subtle}>Positions: {election.positions.join(", ")}</p>

              <button className={styles.primaryButton} disabled={saving} onClick={handlePublish}>
                <Radio size={14} /> {saving ? "Publishing..." : "Publish Election"}
              </button>
            </section>
          )}

          {election && (election.status === "PUBLISHED" || election.status === "CLOSED") && (
            <section className={styles.card}>
              <div className={styles.resultsHeader}>
                <h2>
                  <Crown size={18} /> Results ({ballotCount} ballot{ballotCount === 1 ? "" : "s"} submitted)
                </h2>

                {election.status === "PUBLISHED" ? (
                  <button className={styles.dangerButton} disabled={saving} onClick={handleClose}>
                    {saving ? "Closing..." : "Close Election"}
                  </button>
                ) : (
                  <button className={styles.primaryButton} onClick={handleStartNew}>
                    <RefreshCw size={14} /> Start New Election
                  </button>
                )}
              </div>

              <div className={styles.resultsGrid}>
                {results.map((row) => (
                  <div key={row.position} className={styles.resultCard}>
                    <h3>{row.position}</h3>

                    {row.tally.length === 0 ? (
                      <p className={styles.subtle}>No votes yet.</p>
                    ) : (
                      <>
                        {row.winners.length > 1 && (
                          <p className={styles.tieBadge}>
                            TIE — {row.winners.join(", ")} ({row.maxCount} vote
                            {row.maxCount === 1 ? "" : "s"} each)
                          </p>
                        )}

                        <div className={styles.tallyList}>
                          {row.tally.map((t) => (
                            <div key={t.name} className={styles.tallyRow}>
                              <span className={row.winners.includes(t.name) ? styles.leaderName : ""}>
                                {row.winners.includes(t.name) && !row.winners[1] && (
                                  <Crown size={13} />
                                )}
                                {t.name}
                              </span>
                              <span className={styles.tallyCount}>{t.count}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {!election || election.status === "DRAFT" ? (
            <div className={styles.empty}>No active election right now.</div>
          ) : (
            <section className={styles.card}>
              <h2>
                <Vote size={18} /> Cast Your Ballot
              </h2>

              <p className={styles.subtle}>
                Pick who you think fits each position best. Team positions let you pick more than
                one person. One person can only be picked once anywhere on your ballot —
                already-picked names are removed from the other dropdowns. You can come back and
                change your answers any time before the election closes.
              </p>

              {election.status === "CLOSED" && (
                <p className={styles.tieBadge}>This election is closed — voting is no longer open.</p>
              )}

              <div className={styles.ballotList}>
                {election.positions.map((position) => {
                  const otherNames = new Set(
                    Object.entries(myBallot)
                      .filter(([p]) => p !== position)
                      .flatMap(([, value]) => (Array.isArray(value) ? value : value ? [value] : []))
                  );

                  if (MULTI_SELECT_POSITIONS.has(position)) {
                    const current = Array.isArray(myBallot[position])
                      ? (myBallot[position] as string[])
                      : [];

                    const available = election.roster.filter(
                      (name) => !otherNames.has(name) && !current.includes(name)
                    );

                    return (
                      <div key={position} className={styles.ballotRow}>
                        <label>{position}</label>

                        <div className={styles.multiSelectBody}>
                          <select
                            value=""
                            disabled={election.status === "CLOSED"}
                            onChange={(e) => {
                              if (e.target.value) handleAddMulti(position, e.target.value);
                            }}
                          >
                            <option value="">+ Add person</option>
                            {available.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>

                          {current.length > 0 && (
                            <div className={styles.chips}>
                              {current.map((name) => (
                                <span key={name} className={styles.chip}>
                                  {name}
                                  {election.status !== "CLOSED" && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMulti(position, name)}
                                      aria-label={`Remove ${name}`}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const currentSingle =
                    typeof myBallot[position] === "string" ? (myBallot[position] as string) : "";

                  return (
                    <div key={position} className={styles.ballotRow}>
                      <label>{position}</label>

                      <select
                        value={currentSingle}
                        disabled={election.status === "CLOSED"}
                        onChange={(e) => handleSelect(position, e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {election.roster
                          .filter((name) => !otherNames.has(name))
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {election.status === "PUBLISHED" && (
                <button className={styles.primaryButton} disabled={saving} onClick={handleSubmitBallot}>
                  <Send size={14} /> {saving ? "Submitting..." : "Submit Ballot"}
                </button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
