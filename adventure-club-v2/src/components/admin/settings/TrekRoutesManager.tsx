"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./TrekRoutesManager.module.scss";

type Trek = {
  id: string;
  title: string;
  destination: string;
  date: string;
};

type Waypoint = {
  id: string;
  label: string;
  description: string | null;
  latitude: number;
  longitude: number;
  mediaUrl: string | null;
  mediaType: string;
};

const emptyDraft = {
  label: "",
  description: "",
  latitude: "",
  longitude: "",
  mediaUrl: "",
  mediaType: "image" as "image" | "video",
};

export default function TrekRoutesManager() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Waypoint>>({});

  const [loadingTreks, setLoadingTreks] = useState(true);
  const [loadingWaypoints, setLoadingWaypoints] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [status, setStatus] = useState("");

  const [newWaypoint, setNewWaypoint] = useState(emptyDraft);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTreks() {
      try {
        const res = await fetch("/api/treks");
        const data = await res.json();
        if (!active) return;

        const list: Trek[] = Array.isArray(data) ? data : [];
        setTreks(list);
        if (list.length > 0) setSelectedTrekId(list[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingTreks(false);
      }
    }

    loadTreks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTrekId) return;

    let active = true;

    async function loadWaypoints() {
      setLoadingWaypoints(true);

      try {
        const res = await fetch(`/api/admin/treks/${selectedTrekId}/waypoints`);
        const data = await res.json();
        if (!active) return;

        const list: Waypoint[] = Array.isArray(data) ? data : [];
        setWaypoints(list);
        setDrafts(Object.fromEntries(list.map((w) => [w.id, w])));
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingWaypoints(false);
      }
    }

    loadWaypoints();

    return () => {
      active = false;
    };
  }, [selectedTrekId]);

  function updateDraft(id: string, field: keyof Waypoint, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveWaypoint(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/treks/${selectedTrekId}/waypoints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          description: draft.description,
          latitude: draft.latitude,
          longitude: draft.longitude,
          mediaUrl: draft.mediaUrl,
          mediaType: draft.mediaType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save waypoint.");
        return;
      }

      setWaypoints((prev) => prev.map((w) => (w.id === id ? data : w)));
      setStatus("Waypoint saved.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteWaypoint(id: string) {
    const confirmed = confirm("Remove this waypoint?");
    if (!confirmed) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/treks/${selectedTrekId}/waypoints/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWaypoints((prev) => prev.filter((w) => w.id !== id));
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

  async function addWaypoint(e: React.FormEvent) {
    e.preventDefault();
    if (!newWaypoint.label.trim() || !newWaypoint.latitude || !newWaypoint.longitude) return;

    setAdding(true);
    setStatus("");

    try {
      const res = await fetch(`/api/admin/treks/${selectedTrekId}/waypoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWaypoint),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to add waypoint.");
        return;
      }

      setWaypoints((prev) => [...prev, data]);
      setDrafts((prev) => ({ ...prev, [data.id]: data }));
      setNewWaypoint(emptyDraft);
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  if (loadingTreks) {
    return <p className={styles.hint}>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="3D Route Waypoints"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "3D Route Waypoints" },
        ]}
      />

      <p className={styles.subtitle}>
        Controls the terrain preview map below Upcoming Treks on the homepage — pick a trek, then
        add the waypoints (trailhead, halfway point, summit, etc.) people will be able to fly to. A
        trek only shows up in that map picker once it has at least one waypoint here.
      </p>

      {treks.length === 0 ? (
        <p className={styles.hint}>No current treks yet.</p>
      ) : (
        <div className={styles.trekPicker}>
          <label>Trek</label>
          <select value={selectedTrekId} onChange={(e) => setSelectedTrekId(e.target.value)}>
            {treks.map((trek) => (
              <option key={trek.id} value={trek.id}>
                {trek.title} — {new Date(trek.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>
      )}

      {status && <p className={styles.status}>{status}</p>}

      {loadingWaypoints ? (
        <p className={styles.hint}>Loading waypoints...</p>
      ) : (
        <div className={styles.waypointsSection}>
          {waypoints.length === 0 ? (
            <p className={styles.hint}>No waypoints yet for this trek — add one below.</p>
          ) : (
            <div className={styles.waypointsList}>
              {waypoints.map((waypoint) => {
                const draft = drafts[waypoint.id] || waypoint;

                return (
                  <div key={waypoint.id} className={styles.waypointRow}>
                    <input
                      placeholder="Label (e.g. Trailhead)"
                      value={draft.label}
                      onChange={(e) => updateDraft(waypoint.id, "label", e.target.value)}
                    />
                    <input
                      placeholder="Description"
                      value={draft.description || ""}
                      onChange={(e) => updateDraft(waypoint.id, "description", e.target.value)}
                    />
                    <input
                      placeholder="Latitude"
                      value={draft.latitude}
                      onChange={(e) => updateDraft(waypoint.id, "latitude", e.target.value)}
                    />
                    <input
                      placeholder="Longitude"
                      value={draft.longitude}
                      onChange={(e) => updateDraft(waypoint.id, "longitude", e.target.value)}
                    />
                    <input
                      placeholder="Photo/video URL (optional)"
                      value={draft.mediaUrl || ""}
                      onChange={(e) => updateDraft(waypoint.id, "mediaUrl", e.target.value)}
                    />
                    <select
                      value={draft.mediaType}
                      onChange={(e) => updateDraft(waypoint.id, "mediaType", e.target.value)}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>

                    <div className={styles.waypointRowActions}>
                      <button
                        type="button"
                        className={styles.saveRowButton}
                        onClick={() => saveWaypoint(waypoint.id)}
                        disabled={savingId === waypoint.id}
                      >
                        {savingId === waypoint.id ? "Saving..." : "Save"}
                      </button>

                      <button
                        type="button"
                        className={styles.deleteRowButton}
                        onClick={() => deleteWaypoint(waypoint.id)}
                        disabled={deletingId === waypoint.id}
                        aria-label="Delete waypoint"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form className={styles.addForm} onSubmit={addWaypoint}>
            <input
              placeholder="Label (e.g. Trailhead)"
              value={newWaypoint.label}
              onChange={(e) => setNewWaypoint((prev) => ({ ...prev, label: e.target.value }))}
            />
            <input
              placeholder="Description"
              value={newWaypoint.description}
              onChange={(e) => setNewWaypoint((prev) => ({ ...prev, description: e.target.value }))}
            />
            <input
              placeholder="Latitude"
              value={newWaypoint.latitude}
              onChange={(e) => setNewWaypoint((prev) => ({ ...prev, latitude: e.target.value }))}
            />
            <input
              placeholder="Longitude"
              value={newWaypoint.longitude}
              onChange={(e) => setNewWaypoint((prev) => ({ ...prev, longitude: e.target.value }))}
            />
            <input
              placeholder="Photo/video URL (optional)"
              value={newWaypoint.mediaUrl}
              onChange={(e) => setNewWaypoint((prev) => ({ ...prev, mediaUrl: e.target.value }))}
            />
            <select
              value={newWaypoint.mediaType}
              onChange={(e) =>
                setNewWaypoint((prev) => ({ ...prev, mediaType: e.target.value as "image" | "video" }))
              }
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>

            <button type="submit" disabled={adding || !selectedTrekId}>
              {adding ? "Adding..." : "Add Waypoint"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
