"use client";

import { Fragment, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Plus, QrCode, Save, Trash2, X } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import TestVisibilityPicker from "@/components/admin/TestVisibilityPicker";
import CopyLinkButton from "@/components/admin/shared/CopyLinkButton";
import { PREFERENCE_LABELS } from "@/lib/recruitment-options";
import styles from "./RecruitmentAdmin.module.scss";

const RECRUITMENT_PATH = "/dashboard/recruitment";

type Settings = {
  opensAt: string | null;
  closesAt: string | null;
  interviewDayOptions: string[];
  isTest: boolean;
  testVisibleToUserIds: string[];
};

type Applicant = {
  fullName: string;
  email: string;
  phoneNumber: string;
  collegeRollNumber: string | null;
  institution: string;
  department: string;
  year: string;
};

type Application = {
  id: string;
  user: Applicant;
  portfolioText: string | null;
  portfolioLink: string | null;
  portfolioFileUrl: string | null;
  whyJoin: string;
  interviewDay: string;
  teamPreferences: string[];
  submittedAt: string;
};

// Matches TripCentreEditor's convention exactly: slice the fetched ISO
// string directly rather than round-tripping through `new Date()` again.
function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function RecruitmentAdmin() {
  const [settings, setSettings] = useState<Settings>({
    opensAt: null,
    closesAt: null,
    interviewDayOptions: [],
    isTest: false,
    testVisibleToUserIds: [],
  });
  const [newDay, setNewDay] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [settingsRes, applicationsRes] = await Promise.all([
          fetch("/api/admin/recruitment/settings"),
          fetch("/api/admin/recruitment"),
        ]);

        if (!active) return;

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (applicationsRes.ok) setApplications(await applicationsRes.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this application? This can't be undone.")) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/recruitment/${id}`, { method: "DELETE" });

      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function generateQr() {
    setGeneratingQr(true);

    try {
      const url = `${window.location.origin}${RECRUITMENT_PATH}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: { dark: "#0d0d0d", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } finally {
      setGeneratingQr(false);
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "navira-recruitment-qr.png";
    link.click();
  }

  function addDayOption() {
    const trimmed = newDay.trim();
    if (!trimmed || settings.interviewDayOptions.includes(trimmed)) return;

    setSettings((prev) => ({
      ...prev,
      interviewDayOptions: [...prev.interviewDayOptions, trimmed],
    }));
    setNewDay("");
  }

  function removeDayOption(day: string) {
    setSettings((prev) => ({
      ...prev,
      interviewDayOptions: prev.interviewDayOptions.filter((d) => d !== day),
    }));
  }

  async function saveSettings() {
    setSavingSettings(true);

    try {
      await fetch("/api/admin/recruitment/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opensAt: toDateTimeLocal(settings.opensAt),
          closesAt: toDateTimeLocal(settings.closesAt),
          interviewDayOptions: settings.interviewDayOptions,
          isTest: settings.isTest,
          testVisibleToUserIds: settings.testVisibleToUserIds,
        }),
      });
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Recruitment" breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Recruitment" }]} />

      <div className={styles.settingsCard}>
        <h3>Share</h3>

        <div className={styles.shareRow}>
          <CopyLinkButton path={RECRUITMENT_PATH} label="Copy Recruitment Link" />

          <button type="button" className={styles.saveButton} onClick={generateQr} disabled={generatingQr}>
            <QrCode size={15} /> {generatingQr ? "Generating..." : "Generate QR Code"}
          </button>
        </div>

        {qrDataUrl && (
          <div className={styles.qrPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code linking to the recruitment page" />

            <button type="button" className={styles.saveButton} onClick={downloadQr}>
              <Download size={15} /> Download QR Code
            </button>
          </div>
        )}
      </div>

      <div className={styles.settingsCard}>
        <h3>Application Window</h3>

        <div className={styles.dateRow}>
          <label>
            Opens At
            <input
              type="datetime-local"
              value={toDateTimeLocal(settings.opensAt)}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, opensAt: e.target.value || null }))
              }
            />
          </label>

          <label>
            Closes At
            <input
              type="datetime-local"
              value={toDateTimeLocal(settings.closesAt)}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, closesAt: e.target.value || null }))
              }
            />
          </label>
        </div>

        <h3>Interview Day Options</h3>

        <div className={styles.dayPills}>
          {settings.interviewDayOptions.map((day) => (
            <span key={day} className={styles.dayPill}>
              {day}
              <button type="button" onClick={() => removeDayOption(day)}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        <div className={styles.addDayRow}>
          <input
            type="text"
            placeholder="e.g. Monday, 31st October"
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDayOption();
              }
            }}
          />
          <button type="button" onClick={addDayOption}>
            <Plus size={15} /> Add
          </button>
        </div>

        <h3>Test Mode</h3>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.isTest}
            onChange={(e) => setSettings((prev) => ({ ...prev, isTest: e.target.checked }))}
          />
          Only show the banner/form to specific students (rehearse before going live)
        </label>

        {settings.isTest && (
          <TestVisibilityPicker
            selectedIds={settings.testVisibleToUserIds}
            onChange={(ids) => setSettings((prev) => ({ ...prev, testVisibleToUserIds: ids }))}
          />
        )}

        <button
          type="button"
          className={styles.saveButton}
          onClick={saveSettings}
          disabled={savingSettings}
        >
          <Save size={15} /> {savingSettings ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className={styles.tableCard}>
        <h3>Applications ({applications.length})</h3>

        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : applications.length === 0 ? (
          <p className={styles.empty}>No applications submitted yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No.</th>
                  <th>Year / Course</th>
                  <th>Contact</th>
                  <th>Preferences</th>
                  <th>Interview Day</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr
                      className={styles.row}
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      <td>{app.user.fullName}</td>
                      <td>{app.user.collegeRollNumber || "—"}</td>
                      <td>
                        {app.user.year}
                        {app.user.department ? ` · ${app.user.department}` : ""}
                      </td>
                      <td>
                        <div>{app.user.phoneNumber}</div>
                        <div className={styles.muted}>{app.user.email}</div>
                      </td>
                      <td>
                        {app.teamPreferences.map((t, i) => (
                          <div key={t} className={styles.muted}>
                            {PREFERENCE_LABELS[i]}: {t}
                          </div>
                        ))}
                      </td>
                      <td>{app.interviewDay}</td>
                      <td>{new Date(app.submittedAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app.id);
                          }}
                          disabled={deletingId === app.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>

                    {expandedId === app.id && (
                      <tr className={styles.detailRow}>
                        <td colSpan={8}>
                          <div className={styles.detail}>
                            <div>
                              <strong>Why they want to join</strong>
                              <p>{app.whyJoin}</p>
                            </div>

                            {(app.portfolioText || app.portfolioLink || app.portfolioFileUrl) && (
                              <div>
                                <strong>Portfolio</strong>
                                {app.portfolioText && <p>{app.portfolioText}</p>}
                                {app.portfolioLink && (
                                  <a href={app.portfolioLink} target="_blank" rel="noopener noreferrer">
                                    {app.portfolioLink}
                                  </a>
                                )}
                                {app.portfolioFileUrl && (
                                  <a href={app.portfolioFileUrl} target="_blank" rel="noopener noreferrer">
                                    View uploaded file
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
