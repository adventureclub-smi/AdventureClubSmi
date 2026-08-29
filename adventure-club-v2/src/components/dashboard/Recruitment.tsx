"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Link2,
  Paperclip,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import BackButton from "./shared/BackButton";
import { getRecruitmentProfileGaps, type RecruitmentProfileInput } from "@/lib/recruitment-profile-gaps";
import {
  MAX_TEAM_PREFERENCES,
  PORTFOLIO_REQUIRED_TEAMS,
  PREFERENCE_LABELS,
  RECRUITMENT_TEAM_DESCRIPTIONS,
  RECRUITMENT_TEAMS,
} from "@/lib/recruitment-options";
import styles from "./Recruitment.module.scss";

type Settings = {
  opensAt: string | null;
  closesAt: string | null;
  interviewDayOptions: string[];
  isOpen: boolean;
};

type Application = {
  id: string;
  portfolioText: string | null;
  portfolioLink: string | null;
  portfolioFileUrl: string | null;
  whyJoin: string;
  interviewDay: string;
  teamPreferences: string[];
  submittedAt: string;
};

type Profile = RecruitmentProfileInput;

const portfolioRequiredTeams: readonly string[] = PORTFOLIO_REQUIRED_TEAMS;

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Recruitment() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [editing, setEditing] = useState(false);

  const [portfolioText, setPortfolioText] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [portfolioFileUrl, setPortfolioFileUrl] = useState<string | null>(null);
  const [portfolioFileName, setPortfolioFileName] = useState<string | null>(null);
  const [whyJoin, setWhyJoin] = useState("");
  const [interviewDay, setInterviewDay] = useState("");
  const [teamPreferences, setTeamPreferences] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [settingsRes, profileRes, applicationRes] = await Promise.all([
          fetch("/api/recruitment/settings"),
          fetch("/api/profile"),
          fetch("/api/recruitment"),
        ]);

        if (!active) return;

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());

        if (applicationRes.ok) {
          const data = await applicationRes.json();

          if (data) {
            setApplication(data);
            setPortfolioText(data.portfolioText || "");
            setPortfolioLink(data.portfolioLink || "");
            setPortfolioFileUrl(data.portfolioFileUrl || null);
            setWhyJoin(data.whyJoin || "");
            setInterviewDay(data.interviewDay || "");
            setTeamPreferences(data.teamPreferences || []);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const gaps = useMemo(() => (profile ? getRecruitmentProfileGaps(profile) : []), [profile]);

  const needsPortfolio = teamPreferences.some((t) => portfolioRequiredTeams.includes(t));

  function toggleTeam(team: string) {
    setTeamPreferences((prev) => {
      if (prev.includes(team)) return prev.filter((t) => t !== team);
      if (prev.length >= MAX_TEAM_PREFERENCES) return prev;
      return [...prev, team];
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/recruitment/portfolio-upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to upload file.");
        return;
      }

      setPortfolioFileUrl(data.url);
      setPortfolioFileName(file.name);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioText,
          portfolioLink,
          portfolioFileUrl,
          whyJoin,
          interviewDay,
          teamPreferences,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to submit application.");
        return;
      }

      setApplication(data);
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("Withdraw your application? You can submit a new one later, as long as recruitment is still open.")) {
      return;
    }

    setWithdrawing(true);
    setError(null);

    try {
      const res = await fetch("/api/recruitment", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to withdraw application.");
        return;
      }

      setApplication(null);
      setPortfolioText("");
      setPortfolioLink("");
      setPortfolioFileUrl(null);
      setPortfolioFileName(null);
      setWhyJoin("");
      setInterviewDay("");
      setTeamPreferences([]);
      setEditing(false);
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <BackButton />
        <p className={styles.empty}>Loading...</p>
      </div>
    );
  }

  if (gaps.length > 0) {
    return (
      <div className={styles.container}>
        <BackButton />

        <div className={styles.notice}>
          <AlertTriangle size={20} />
          <div>
            <h2>Complete your profile first</h2>
            <p>
              Your recruitment application uses your profile details. Please fill in:{" "}
              <strong>{gaps.join(", ")}</strong>.
            </p>
            <Link href="/dashboard/profile" className={styles.primaryAction}>
              Go to My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (settings && !settings.isOpen && !application) {
    return (
      <div className={styles.container}>
        <BackButton />

        <div className={styles.notice}>
          <CalendarDays size={20} />
          <div>
            <h2>Recruitment isn&apos;t open right now</h2>
            <p>
              {settings.opensAt && new Date(settings.opensAt) > new Date()
                ? `Applications open on ${formatDate(settings.opensAt)}.`
                : "Check back soon, or watch for an announcement."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (application && !editing) {
    return (
      <div className={styles.container}>
        <BackButton />

        <div className={styles.header}>
          <h1>Recruitment</h1>
          <p>Your application has been submitted.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.summaryTop}>
            <CheckCircle2 size={20} className={styles.successIcon} />
            <span>Submitted on {formatDate(application.submittedAt)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Team Preferences</span>
            <div className={styles.prefBadges}>
              {application.teamPreferences.map((team, i) => (
                <span key={team} className={styles.prefBadge}>
                  {PREFERENCE_LABELS[i]}: {team}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.summaryRow}>
            <span>Preferred Interview Day</span>
            <strong>{application.interviewDay}</strong>
          </div>

          {(application.portfolioText || application.portfolioLink || application.portfolioFileUrl) && (
            <div className={styles.summaryRow}>
              <span>Portfolio</span>
              <div>
                {application.portfolioText && <p>{application.portfolioText}</p>}
                {application.portfolioLink && (
                  <a href={application.portfolioLink} target="_blank" rel="noopener noreferrer">
                    {application.portfolioLink}
                  </a>
                )}
                {application.portfolioFileUrl && (
                  <a href={application.portfolioFileUrl} target="_blank" rel="noopener noreferrer">
                    View uploaded file
                  </a>
                )}
              </div>
            </div>
          )}

          <div className={styles.summaryRow}>
            <span>Why you want to join</span>
            <p>{application.whyJoin}</p>
          </div>

          <div className={styles.actions}>
            {settings?.isOpen && (
              <button type="button" className={styles.secondaryAction} onClick={() => setEditing(true)}>
                <Pencil size={15} /> Edit Application
              </button>
            )}

            <button
              type="button"
              className={styles.dangerAction}
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              <Trash2 size={15} /> {withdrawing ? "Withdrawing..." : "Withdraw Application"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <BackButton />

      <div className={styles.header}>
        <h1>Recruitment</h1>
        <p>Apply to join a NAVIRA team.</p>
      </div>

      <form className={styles.card} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h3>Your Details</h3>

          <div className={styles.prefillGrid}>
            <div>
              <span>Name</span>
              <strong>{profile?.fullName}</strong>
            </div>
            <div>
              <span>Course</span>
              <strong>{profile?.department || "—"}</strong>
            </div>
            <div>
              <span>Year</span>
              <strong>{profile?.year}</strong>
            </div>
            <div>
              <span>Roll Number</span>
              <strong>{profile?.collegeRollNumber}</strong>
            </div>
            <div>
              <span>Phone Number</span>
              <strong>{profile?.phoneNumber}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile?.email}</strong>
            </div>
          </div>

          <p className={styles.hint}>
            Need to fix something here? Update it on <Link href="/dashboard/profile">My Profile</Link>.
          </p>
        </section>

        <section className={styles.section}>
          <h3>
            <FileText size={16} /> Portfolio / Work Experience
            {needsPortfolio ? (
              <span className={styles.required}>Required for Visual Media / Marketing</span>
            ) : (
              <span className={styles.optional}>Optional for your selected team(s)</span>
            )}
          </h3>

          <p className={styles.hint}>
            A portfolio is mandatory only for Visual Media and Marketing applicants — for every other
            team it's optional, but still worth including if you have relevant work to show.
          </p>

          <label>
            Describe your work or experience
            <textarea
              rows={4}
              value={portfolioText}
              onChange={(e) => setPortfolioText(e.target.value)}
              placeholder="Type it out here..."
            />
          </label>

          <label>
            <Link2 size={14} /> Link (Drive, Behance, Instagram, portfolio site, etc.)
            <input
              type="url"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            <Paperclip size={14} /> Or upload a file
            <input type="file" onChange={handleFileChange} disabled={uploading} />
          </label>

          {uploading && <p className={styles.hint}>Uploading...</p>}

          {portfolioFileUrl && !uploading && (
            <div className={styles.filePill}>
              <Upload size={14} />
              <span>{portfolioFileName || "File uploaded"}</span>
              <button
                type="button"
                onClick={() => {
                  setPortfolioFileUrl(null);
                  setPortfolioFileName(null);
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3>
            <Sparkles size={16} /> Why do you want to join the club?
          </h3>

          <textarea
            rows={5}
            value={whyJoin}
            onChange={(e) => setWhyJoin(e.target.value)}
            placeholder="Tell us..."
            required
          />
        </section>

        <section className={styles.section}>
          <h3>
            <CalendarDays size={16} /> Preferred Day for Interview
          </h3>

          {settings && settings.interviewDayOptions.length > 0 ? (
            <div className={styles.dayOptions}>
              {settings.interviewDayOptions.map((day) => (
                <button
                  type="button"
                  key={day}
                  className={interviewDay === day ? styles.dayActive : styles.day}
                  onClick={() => setInterviewDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.hint}>Interview days haven&apos;t been announced yet — check back soon.</p>
          )}
        </section>

        <section className={styles.section}>
          <h3>
            <Users size={16} /> About Our Teams
          </h3>

          <div className={styles.teamAccordion}>
            {RECRUITMENT_TEAMS.map((team) => (
              <details key={team} className={styles.teamDetails}>
                <summary>
                  <span>{team}</span>
                  <ChevronDown size={16} className={styles.teamChevron} />
                </summary>
                <div className={styles.teamDescription}>
                  {RECRUITMENT_TEAM_DESCRIPTIONS[team].split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>
            <Users size={16} /> Team Preferences
          </h3>
          <p className={styles.hint}>
            Select up to {MAX_TEAM_PREFERENCES}, in the order you&apos;d prefer them.
          </p>

          <div className={styles.teamGrid}>
            {RECRUITMENT_TEAMS.map((team) => {
              const rank = teamPreferences.indexOf(team);
              const selected = rank !== -1;

              return (
                <button
                  type="button"
                  key={team}
                  className={selected ? styles.teamActive : styles.team}
                  onClick={() => toggleTeam(team)}
                  disabled={!selected && teamPreferences.length >= MAX_TEAM_PREFERENCES}
                >
                  {selected && <span className={styles.rankBadge}>{PREFERENCE_LABELS[rank]}</span>}
                  {team}
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryAction}
            disabled={submitting || uploading || !settings?.isOpen}
          >
            {submitting ? "Submitting..." : application ? "Save Changes" : "Submit Application"}
          </button>

          {editing && (
            <button type="button" className={styles.secondaryAction} onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
