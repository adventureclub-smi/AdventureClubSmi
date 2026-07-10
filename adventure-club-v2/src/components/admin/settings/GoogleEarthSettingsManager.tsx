"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./GoogleEarthSettingsManager.module.scss";

type TrailStat = {
  id: string;
  label: string;
  value: string;
  tooltip: string | null;
};

export default function GoogleEarthSettingsManager() {
  const [earthUrl, setEarthUrl] = useState("");
  const [stats, setStats] = useState<TrailStat[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TrailStat>>({});

  const [loading, setLoading] = useState(true);
  const [savingUrl, setSavingUrl] = useState(false);
  const [savingStatId, setSavingStatId] = useState("");
  const [deletingStatId, setDeletingStatId] = useState("");
  const [status, setStatus] = useState("");

  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newTooltip, setNewTooltip] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [urlRes, statsRes] = await Promise.all([
          fetch("/api/admin/settings/google-earth"),
          fetch("/api/admin/trail-stats"),
        ]);

        if (!active) return;

        const urlData = await urlRes.json();
        const statsData = await statsRes.json();

        setEarthUrl(urlData.earthUrl || "");

        const list: TrailStat[] = Array.isArray(statsData) ? statsData : [];
        setStats(list);
        setDrafts(Object.fromEntries(list.map((s) => [s.id, s])));
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function saveUrl() {
    setSavingUrl(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/settings/google-earth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earthUrl }),
      });

      const data = await res.json();
      setStatus(res.ok ? "Google Earth link saved." : data.message || "Failed to save.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSavingUrl(false);
    }
  }

  function updateDraft(id: string, field: keyof TrailStat, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveStat(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingStatId(id);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/trail-stats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          value: draft.value,
          tooltip: draft.tooltip,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save stat.");
        return;
      }

      setStats((prev) => prev.map((s) => (s.id === id ? data : s)));
      setStatus("Trail stat saved.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSavingStatId("");
    }
  }

  async function deleteStat(id: string) {
    const confirmed = confirm("Remove this trail stat?");
    if (!confirmed) return;

    setDeletingStatId(id);

    try {
      const res = await fetch(`/api/admin/trail-stats/${id}`, { method: "DELETE" });

      if (res.ok) {
        setStats((prev) => prev.filter((s) => s.id !== id));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingStatId("");
    }
  }

  async function addStat(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim() || !newValue.trim()) return;

    setAdding(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/trail-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, value: newValue, tooltip: newTooltip }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add stat.");
        return;
      }

      setStats((prev) => [...prev, data]);
      setDrafts((prev) => ({ ...prev, [data.id]: data }));
      setNewLabel("");
      setNewValue("");
      setNewTooltip("");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <p className={styles.hint}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="3D Explorer"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "3D Explorer" },
        ]}
      />

      <p className={styles.subtitle}>
        Controls the homepage &ldquo;Fly The Route Before You Hike It.&rdquo; card — the Google
        Earth link it opens, and the trail-stat cards shown on it.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.form}>
        <label>Google Earth Link</label>
        <input
          placeholder="https://earth.google.com/earth/d/..."
          value={earthUrl}
          onChange={(e) => setEarthUrl(e.target.value)}
        />

        <button onClick={saveUrl} disabled={savingUrl}>
          {savingUrl ? "Saving..." : "Save Link"}
        </button>
      </div>

      <div className={styles.statsSection}>
        <h3>Trail Stats</h3>

        {stats.length === 0 ? (
          <p className={styles.hint}>No trail stats yet — add one below.</p>
        ) : (
          <div className={styles.statsList}>
            {stats.map((stat) => {
              const draft = drafts[stat.id] || stat;

              return (
                <div key={stat.id} className={styles.statRow}>
                  <input
                    placeholder="Label"
                    value={draft.label}
                    onChange={(e) => updateDraft(stat.id, "label", e.target.value)}
                  />
                  <input
                    placeholder="Value"
                    value={draft.value}
                    onChange={(e) => updateDraft(stat.id, "value", e.target.value)}
                  />
                  <input
                    placeholder="Tooltip (optional)"
                    value={draft.tooltip || ""}
                    onChange={(e) => updateDraft(stat.id, "tooltip", e.target.value)}
                  />

                  <div className={styles.statRowActions}>
                    <button
                      type="button"
                      className={styles.saveRowButton}
                      onClick={() => saveStat(stat.id)}
                      disabled={savingStatId === stat.id}
                    >
                      {savingStatId === stat.id ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteRowButton}
                      onClick={() => deleteStat(stat.id)}
                      disabled={deletingStatId === stat.id}
                      aria-label="Delete stat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form className={styles.addForm} onSubmit={addStat}>
          <input
            placeholder="Label (e.g. Max Elevation)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            placeholder="Value (e.g. 1,450m)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <input
            placeholder="Tooltip (optional)"
            value={newTooltip}
            onChange={(e) => setNewTooltip(e.target.value)}
          />

          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Stat"}
          </button>
        </form>
      </div>
    </div>
  );
}
