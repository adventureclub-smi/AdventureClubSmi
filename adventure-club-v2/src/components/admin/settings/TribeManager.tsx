"use client";

import { useRef, useState } from "react";
import { Users, UploadCloud, Trash2, Pencil, X, Music, GripVertical } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./TribeManager.module.scss";

type TribeMember = {
  id: string;
  name: string;
  role: string;
  tier: number;
  year: string;
  course: string;
  photoUrl: string;
  bio: string;
  songTitle: string | null;
  songUrl: string | null;
};

const ROLE_SUGGESTIONS = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Logistics Head",
  "Visual Media Head",
  "Marketing Head",
  "Social Media Head",
  "Web & Tech Head",
  "Event Head",
  "Finance Head",
  "Faculty Head",
  "Team Logistics",
  "Team Web & Tech",
  "Team Events",
  "Team Finance",
  "Team Visual Media",
  "Team Social Media",
];

const emptyFields = {
  name: "",
  role: "",
  tier: "3",
  year: "",
  course: "",
  bio: "",
  songTitle: "",
};

export default function TribeManager({
  initialMembers,
}: {
  initialMembers: TribeMember[];
}) {
  const [members, setMembers] = useState<TribeMember[]>(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fields, setFields] = useState(emptyFields);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [songFile, setSongFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);

  function handleField(key: keyof typeof emptyFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file for the photo.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStatus("");
  }

  function handleSongChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setStatus("Please select an MP3 audio file.");
      return;
    }

    setSongFile(file);
    setStatus("");
  }

  function resetForm() {
    setEditingId(null);
    setFields(emptyFields);
    setPhotoFile(null);
    setPhotoPreview("");
    setSongFile(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (songInputRef.current) songInputRef.current.value = "";
  }

  function startEdit(member: TribeMember) {
    setEditingId(member.id);
    setFields({
      name: member.name,
      role: member.role,
      tier: String(member.tier),
      year: member.year,
      course: member.course,
      bio: member.bio,
      songTitle: member.songTitle || "",
    });
    setPhotoFile(null);
    setPhotoPreview(member.photoUrl);
    setSongFile(null);
    setStatus("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { name, role, year, course, bio, songTitle } = fields;

    if (!name.trim() || !role.trim() || !bio.trim()) {
      setStatus("Name, role and bio are all required.");
      return;
    }

    if (!editingId && !photoFile) {
      setStatus("A photo is required.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("role", role.trim());
      form.append("tier", fields.tier);
      form.append("year", year.trim());
      form.append("course", course.trim());
      form.append("bio", bio.trim());
      form.append("songTitle", songTitle.trim());
      if (photoFile) form.append("photoFile", photoFile);
      if (songFile) form.append("songFile", songFile);

      const res = await fetch(
        editingId ? `/api/admin/tribe/${editingId}` : "/api/admin/tribe",
        { method: editingId ? "PUT" : "POST", body: form }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save tribe member.");
        return;
      }

      if (editingId) {
        setMembers((prev) => prev.map((m) => (m.id === editingId ? data : m)));
        setStatus("Tribe member updated.");
      } else {
        setMembers((prev) => [...prev, data]);
        setStatus("Tribe member added.");
      }

      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this person from the Tribe page?")) return;

    const res = await fetch(`/api/admin/tribe/${id}`, { method: "DELETE" });

    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
    }
  }

  const draggedId = useRef<string | null>(null);

  function handleDragStart(id: string) {
    draggedId.current = id;
  }

  // Reorders the local list live as you drag over each row, so the drop
  // target is obvious — the actual save only fires once on drop, not on
  // every row crossed, to avoid a request per pixel of drag movement. This
  // is one flat order across all tiers, but the public Tribe page filters
  // by tier before rendering, so dragging within/across tiers here still
  // reorders correctly within each tier's section on the live page.
  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!draggedId.current || draggedId.current === overId) return;

    setMembers((prev) => {
      const fromIndex = prev.findIndex((m) => m.id === draggedId.current);
      const toIndex = prev.findIndex((m) => m.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleDragEnd() {
    draggedId.current = null;

    await fetch("/api/admin/tribe/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: members.map((m) => m.id) }),
    });
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tribe"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Tribe" },
        ]}
      />

      <p className={styles.subtitle}>
        Manage the core crew shown on the public &quot;Tribe&quot; page. Since
        the roster changes every year, edit or remove anyone here instead of
        touching code.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {editingId && (
          <div className={styles.editingBanner}>
            Editing an existing member
            <button type="button" onClick={resetForm}>
              <X size={14} /> Cancel
            </button>
          </div>
        )}

        <div className={styles.grid}>
          <div>
            <label>Name</label>
            <input
              value={fields.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div>
            <label>Role</label>
            <input
              value={fields.role}
              onChange={(e) => handleField("role", e.target.value)}
              placeholder="e.g. Logistics Head"
              list="tribe-role-suggestions"
            />
            <datalist id="tribe-role-suggestions">
              {ROLE_SUGGESTIONS.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>

          <div>
            <label>Display Group</label>
            <select
              value={fields.tier}
              onChange={(e) => handleField("tier", e.target.value)}
            >
              <option value="1">Core Leadership (President, Treasurer...)</option>
              <option value="2">Department Head</option>
              <option value="3">Team</option>
            </select>
          </div>

          <div>
            <label>Year</label>
            <select
              value={fields.year}
              onChange={(e) => handleField("year", e.target.value)}
            >
              <option value="">Select Year</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
              {/* For faculty/non-student members — the Tribe card and detail
                  panel skip the year entirely when it's this value rather
                  than printing "Not Specified" on the public page. */}
              <option value="Not Specified">Not Specified</option>
            </select>
          </div>

          <div>
            <label>Course</label>
            <input
              value={fields.course}
              onChange={(e) => handleField("course", e.target.value)}
              placeholder="e.g. B.Des — leave blank if not applicable"
            />
          </div>
        </div>

        <div>
          <label>About & Interests</label>
          <textarea
            rows={4}
            value={fields.bio}
            onChange={(e) => handleField("bio", e.target.value)}
            placeholder="A bit about them and what they're into"
          />
        </div>

        <div className={styles.grid}>
          <div>
            <label>Photo{editingId ? " (leave blank to keep current)" : ""}</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <label>Favourite Song Name</label>
            <input
              value={fields.songTitle}
              onChange={(e) => handleField("songTitle", e.target.value)}
              placeholder="Track title (optional)"
            />
          </div>

          <div>
            <label>Favourite Song MP3{editingId ? " (leave blank to keep current)" : " (optional)"}</label>
            <input
              ref={songInputRef}
              type="file"
              accept="audio/*"
              onChange={handleSongChange}
            />
          </div>
        </div>

        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="Photo preview" className={styles.preview} />
        )}

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={saving}>
          <UploadCloud size={15} />
          {saving
            ? editingId
              ? "Saving..."
              : "Adding..."
            : editingId
            ? "Save Changes"
            : "Add to Tribe"}
        </button>
      </form>

      <section className={styles.section}>
        <h3>
          <Users size={17} /> Current Tribe ({members.length})
        </h3>

        {members.length === 0 ? (
          <div className={styles.empty}>No tribe members added yet.</div>
        ) : (
          <div className={styles.list}>
            {members.map((member) => (
              <div
                key={member.id}
                className={styles.row}
                draggable
                onDragStart={() => handleDragStart(member.id)}
                onDragOver={(e) => handleDragOver(e, member.id)}
                onDragEnd={handleDragEnd}
              >
                <span className={styles.dragHandle} aria-hidden="true">
                  <GripVertical size={16} />
                </span>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={member.photoUrl} alt={member.name} className={styles.thumb} />

                <div className={styles.rowInfo}>
                  <strong>{member.name}</strong>
                  <span>
                    {member.role} · {member.year} · {member.course}
                    {member.tier === 1 ? " · Leadership" : member.tier === 2 ? " · Head" : " · Team"}
                  </span>
                </div>

                {member.songUrl && (
                  <span className={styles.songBadge}>
                    <Music size={12} /> {member.songTitle}
                  </span>
                )}

                <button
                  className={styles.editButton}
                  onClick={() => startEdit(member)}
                  aria-label="Edit tribe member"
                >
                  <Pencil size={14} />
                </button>

                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(member.id)}
                  aria-label="Delete tribe member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>
        Drag a row by its handle to reorder — the public Tribe page updates to match within
        each display group.
      </p>
    </div>
  );
}
