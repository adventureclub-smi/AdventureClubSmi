"use client";

import { useRef, useState } from "react";
import { Compass, Pencil, Trash2, UploadCloud, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./ActivitiesManager.module.scss";

type HomepageActivity = {
  id: string;
  icon: string;
  title: string;
  description: string;
  imageUrl: string;
  highlights: string[];
  difficulty: string | null;
  bestSeason: string | null;
  duration: string | null;
  funFact: string | null;
  buttonText: string;
  buttonLink: string;
};

const ICON_OPTIONS = [
  { value: "mountain", label: "Mountain" },
  { value: "tent", label: "Tent" },
  { value: "flame", label: "Flame" },
  { value: "sailboat", label: "Sailboat" },
  { value: "tree-pine", label: "Tree" },
  { value: "footprints", label: "Footprints" },
  { value: "camera", label: "Camera" },
];

const EMPTY_FORM = {
  icon: "mountain",
  title: "",
  description: "",
  highlights: "",
  difficulty: "",
  bestSeason: "",
  duration: "",
  funFact: "",
  buttonText: "",
  buttonLink: "",
};

export default function ActivitiesManager({
  initialActivities,
}: {
  initialActivities: HomepageActivity[];
}) {
  const [activities, setActivities] = useState<HomepageActivity[]>(initialActivities);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus("");
  }

  function startEdit(activity: HomepageActivity) {
    setEditingId(activity.id);
    setForm({
      icon: activity.icon,
      title: activity.title,
      description: activity.description,
      highlights: activity.highlights.join("\n"),
      difficulty: activity.difficulty || "",
      bestSeason: activity.bestSeason || "",
      duration: activity.duration || "",
      funFact: activity.funFact || "",
      buttonText: activity.buttonText,
      buttonLink: activity.buttonLink,
    });
    setImageFile(null);
    setImagePreview(activity.imageUrl);
    setStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    setStatus("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setStatus("Enter a title and description.");
      return;
    }

    if (!form.buttonText.trim() || !form.buttonLink.trim()) {
      setStatus("Enter the button text and link.");
      return;
    }

    if (!editingId && !imageFile) {
      setStatus("Please choose a picture to upload.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const body = new FormData();
      body.append("icon", form.icon);
      body.append("title", form.title.trim());
      body.append("description", form.description.trim());
      body.append("highlights", form.highlights);
      body.append("difficulty", form.difficulty.trim());
      body.append("bestSeason", form.bestSeason.trim());
      body.append("duration", form.duration.trim());
      body.append("funFact", form.funFact.trim());
      body.append("buttonText", form.buttonText.trim());
      body.append("buttonLink", form.buttonLink.trim());
      if (imageFile) body.append("imageFile", imageFile);

      const res = await fetch(
        editingId ? `/api/admin/activities/${editingId}` : "/api/admin/activities",
        { method: editingId ? "PATCH" : "POST", body }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to save activity.");
        return;
      }

      setActivities((prev) =>
        editingId ? prev.map((a) => (a.id === editingId ? data : a)) : [...prev, data]
      );

      setStatus(editingId ? "Activity updated." : "Activity added to the homepage.");
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this activity from the homepage?")) return;

    const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });

    if (res.ok) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) cancelEdit();
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Things We Do"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Things We Do" },
        ]}
      />

      <p className={styles.subtitle}>
        These cards power the &quot;Things We Do&quot; interactive section on the public
        homepage.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label>Picture</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className={styles.preview} />
        )}

        <div className={styles.row2}>
          <div>
            <label>Icon</label>
            <select value={form.icon} onChange={(e) => updateField("icon", e.target.value)}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Trekking"
            />
          </div>
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="e.g. Conquer breathtaking peaks and unforgettable trails."
          />
        </div>

        <div>
          <label>Highlights (one per line)</label>
          <textarea
            value={form.highlights}
            onChange={(e) => updateField("highlights", e.target.value)}
            placeholder={"Sunrise Views\nWeekend Adventures\nBeginner Friendly"}
          />
        </div>

        <div className={styles.row2}>
          <div>
            <label>Difficulty (optional)</label>
            <input
              value={form.difficulty}
              onChange={(e) => updateField("difficulty", e.target.value)}
              placeholder="e.g. Moderate"
            />
          </div>

          <div>
            <label>Best Season (optional)</label>
            <input
              value={form.bestSeason}
              onChange={(e) => updateField("bestSeason", e.target.value)}
              placeholder="e.g. Oct – Feb"
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div>
            <label>Duration (optional)</label>
            <input
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              placeholder="e.g. 1–2 Days"
            />
          </div>

          <div>
            <label>Fun Fact (optional)</label>
            <input
              value={form.funFact}
              onChange={(e) => updateField("funFact", e.target.value)}
              placeholder="e.g. Our highest trek climbs over 2,600m."
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div>
            <label>Button Text</label>
            <input
              value={form.buttonText}
              onChange={(e) => updateField("buttonText", e.target.value)}
              placeholder="e.g. Explore Treks"
            />
          </div>

          <div>
            <label>Button Link</label>
            <input
              value={form.buttonLink}
              onChange={(e) => updateField("buttonLink", e.target.value)}
              placeholder="e.g. /treks"
            />
          </div>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <div className={styles.formButtons}>
          <button type="submit" disabled={saving}>
            <UploadCloud size={15} />
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Activity"}
          </button>

          {editingId && (
            <button type="button" className={styles.cancelButton} onClick={cancelEdit}>
              <X size={15} /> Cancel
            </button>
          )}
        </div>
      </form>

      <section className={styles.section}>
        <h3>
          <Compass size={17} /> On the Homepage ({activities.length})
        </h3>

        {activities.length === 0 ? (
          <div className={styles.empty}>No activities added yet.</div>
        ) : (
          <div className={styles.list}>
            {activities.map((activity) => (
              <div key={activity.id} className={styles.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activity.imageUrl} alt="" className={styles.thumb} />

                <div className={styles.rowInfo}>
                  <strong>{activity.title}</strong>
                  <span>{activity.description}</span>
                </div>

                <div className={styles.rowActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => startEdit(activity)}
                    aria-label="Edit activity"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(activity.id)}
                    aria-label="Remove activity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>New activities are added to the end of the section.</p>
    </div>
  );
}
