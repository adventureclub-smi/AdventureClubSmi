"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Trash2, Video, UploadCloud } from "lucide-react";
import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./TrekRoutesManager.module.scss";

// MapLibre touches window/document/WebGL directly — never render it on the
// server, same isolation pattern as the public homepage embed.
const TrekRoute3DCanvas = dynamic(() => import("@/components/map/TrekRoute3DCanvas"), {
  ssr: false,
});

type Trek = {
  id: string;
  title: string;
  destination: string;
  date: string;
  routePreviewVideoUrl?: string | null;
};

type Waypoint = {
  id: string;
  label: string;
  description: string | null;
  latitude: number;
  longitude: number;
  mediaUrl: string | null;
  mediaType: string;
  order: number;
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

  const [showPreview, setShowPreview] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [removingVideo, setRemovingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const selectedTrek = treks.find((t) => t.id === selectedTrekId) || null;

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

  async function uploadPreviewVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedTrekId) return;

    setUploadingVideo(true);
    setStatus("Uploading and compressing the preview video — this can take a moment...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/admin/treks/${selectedTrekId}/route-preview-video`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to upload preview video.");
        return;
      }

      setTreks((prev) =>
        prev.map((t) =>
          t.id === selectedTrekId ? { ...t, routePreviewVideoUrl: data.routePreviewVideoUrl } : t
        )
      );
      setStatus("Preview video saved.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function removePreviewVideo() {
    if (!selectedTrekId || !confirm("Remove the recorded preview video for this trek?")) return;

    setRemovingVideo(true);

    try {
      await fetch(`/api/admin/treks/${selectedTrekId}/route-preview-video`, { method: "DELETE" });

      setTreks((prev) =>
        prev.map((t) => (t.id === selectedTrekId ? { ...t, routePreviewVideoUrl: null } : t))
      );
      setStatus("Preview video removed.");
    } finally {
      setRemovingVideo(false);
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

      {selectedTrek && waypoints.length > 0 && (
        <div className={styles.previewSection}>
          <h3>Homepage Preview Video</h3>
          <p className={styles.hint}>
            The live 3D map above loads hundreds of satellite/terrain tiles per visitor. Record a
            short flythrough once and the homepage will loop that video instead — click{" "}
            <strong>Start Auto-Fly Preview</strong> below, screen-record it cycling through the
            waypoints, then upload the clip here.
          </p>

          <button
            type="button"
            className={styles.previewToggle}
            onClick={() => setShowPreview((v) => !v)}
          >
            <Video size={15} />
            {showPreview ? "Hide Auto-Fly Preview" : "Start Auto-Fly Preview"}
          </button>

          {showPreview && (
            <div className={styles.previewMapWrap}>
              <TrekRoute3DCanvas
                waypoints={waypoints.map((w) => ({
                  ...w,
                  description: w.description ?? "",
                  mediaUrl: w.mediaUrl ?? "",
                  mediaType: w.mediaType === "video" ? "video" : "image",
                }))}
                autoFly
              />
            </div>
          )}

          <div className={styles.videoRow}>
            {selectedTrek.routePreviewVideoUrl ? (
              <>
                <video
                  src={selectedTrek.routePreviewVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={styles.videoPreview}
                />
                <button
                  type="button"
                  className={styles.removeVideoButton}
                  onClick={removePreviewVideo}
                  disabled={removingVideo}
                >
                  <Trash2 size={14} />
                  {removingVideo ? "Removing..." : "Remove Video"}
                </button>
              </>
            ) : (
              <p className={styles.hint}>No preview video uploaded yet — the live map shows instead.</p>
            )}

            <label className={styles.uploadButton}>
              <UploadCloud size={15} />
              {uploadingVideo ? "Uploading..." : "Upload Recorded Video"}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={uploadPreviewVideo}
                disabled={uploadingVideo}
                hidden
              />
            </label>
          </div>
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
