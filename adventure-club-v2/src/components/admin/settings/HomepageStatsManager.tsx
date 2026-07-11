"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./HomepageStatsManager.module.scss";

type Stat = {
  id: string;
  label: string;
  value: number;
  suffix: string | null;
};

type Draft = {
  label: string;
  value: string;
  suffix: string;
};

function toDraft(stat: Stat): Draft {
  return { label: stat.label, value: String(stat.value), suffix: stat.suffix || "" };
}

export default function HomepageStatsManager() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [status, setStatus] = useState("");

  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newSuffix, setNewSuffix] = useState("+");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/homepage-stats");
        const data = await res.json();

        if (!active) return;

        const list: Stat[] = Array.isArray(data) ? data : [];
        setStats(list);
        setDrafts(Object.fromEntries(list.map((s) => [s.id, toDraft(s)])));
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

  function updateDraft(id: string, field: keyof Draft, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveStat(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/homepage-stats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save stat.");
        return;
      }

      setStats((prev) => prev.map((s) => (s.id === id ? data : s)));
      setDrafts((prev) => ({ ...prev, [id]: toDraft(data) }));
      setStatus("Stat saved.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteStat(id: string) {
    const confirmed = confirm("Remove this stat card from the homepage?");
    if (!confirmed) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/homepage-stats/${id}`, { method: "DELETE" });

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
      setDeletingId("");
    }
  }

  async function addStat(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim() || !newValue.trim()) return;

    setAdding(true);
    setStatus("");

    try {
      const res = await fetch("/api/admin/homepage-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, value: newValue, suffix: newSuffix }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add stat.");
        return;
      }

      setStats((prev) => [...prev, data]);
      setDrafts((prev) => ({ ...prev, [data.id]: toDraft(data) }));
      setNewLabel("");
      setNewValue("");
      setNewSuffix("+");
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
        title="By The Numbers"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "By The Numbers" },
        ]}
      />

      <p className={styles.subtitle}>
        Controls the homepage &ldquo;Adventure Begins By The Numbers&rdquo; stat cards. Each
        card counts up to its value on scroll, e.g. &ldquo;650+ Students&rdquo;.
      </p>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.statsSection}>
        {stats.length === 0 ? (
          <p className={styles.hint}>No stat cards yet — add one below.</p>
        ) : (
          <div className={styles.statsList}>
            {stats.map((stat) => {
              const draft = drafts[stat.id] || toDraft(stat);

              return (
                <div key={stat.id} className={styles.statRow}>
                  <input
                    placeholder="Label (e.g. Students)"
                    value={draft.label}
                    onChange={(e) => updateDraft(stat.id, "label", e.target.value)}
                  />
                  <input
                    placeholder="Value (e.g. 650)"
                    inputMode="numeric"
                    value={draft.value}
                    onChange={(e) => updateDraft(stat.id, "value", e.target.value)}
                  />
                  <input
                    placeholder="Suffix (e.g. +)"
                    value={draft.suffix}
                    onChange={(e) => updateDraft(stat.id, "suffix", e.target.value)}
                  />

                  <div className={styles.statRowActions}>
                    <button
                      type="button"
                      className={styles.saveRowButton}
                      onClick={() => saveStat(stat.id)}
                      disabled={savingId === stat.id}
                    >
                      {savingId === stat.id ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteRowButton}
                      onClick={() => deleteStat(stat.id)}
                      disabled={deletingId === stat.id}
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
            placeholder="Label (e.g. Students)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            placeholder="Value (e.g. 650)"
            inputMode="numeric"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <input
            placeholder="Suffix (e.g. +)"
            value={newSuffix}
            onChange={(e) => setNewSuffix(e.target.value)}
          />

          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Card"}
          </button>
        </form>
      </div>
    </div>
  );
}
