"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import TestVisibilityPicker from "@/components/admin/TestVisibilityPicker";
import styles from "./CreateTrekForm.module.scss";

type FormState = {
  title: string;
  venue: string;
  date: string;
  description: string;
  maxParticipants: string;
  teamSize: string;
  qualifiersCount: "4" | "6";
  matchesPerTeamCap: string;
  eventFormat: "LEAGUE_KNOCKOUT" | "DIRECT_KNOCKOUT";
  registrationOpensAt: string;
  registrationClosesAt: string;
  isTest: boolean;
  testVisibleToUserIds: string[];
};

function buildEmptyForm(): FormState {
  return {
    title: "",
    venue: "",
    date: "",
    description: "",
    maxParticipants: "",
    teamSize: "8",
    qualifiersCount: "4",
    matchesPerTeamCap: "4",
    eventFormat: "LEAGUE_KNOCKOUT",
    registrationOpensAt: "",
    registrationClosesAt: "",
    isTest: false,
    testVisibleToUserIds: [],
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function CreateEventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const isEdit = !!eventId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEdit);
  const [status, setStatus] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<FormState>(buildEmptyForm);

  useEffect(() => {
    if (!eventId) return;

    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok || !active) return;

        const event = await res.json();

        setForm({
          title: event.title || "",
          venue: event.destination || "",
          date: toDateInput(event.date),
          description: event.description || "",
          maxParticipants: event.seats && event.seats !== 99999 ? String(event.seats) : "",
          teamSize: String(event.eventTeamSize ?? "8"),
          qualifiersCount: event.eventQualifiersCount === 6 ? "6" : "4",
          matchesPerTeamCap: String(event.eventMatchesPerTeamCap ?? "4"),
          eventFormat: event.eventFormat === "DIRECT_KNOCKOUT" ? "DIRECT_KNOCKOUT" : "LEAGUE_KNOCKOUT",
          registrationOpensAt: toDateTimeInput(event.registrationOpensAt),
          registrationClosesAt: toDateTimeInput(event.registrationClosesAt),
          isTest: event.isTest ?? false,
          testVisibleToUserIds: event.testVisibleToUserIds ?? [],
        });

        if (event.coverImage) setPreview(event.coverImage);
      } finally {
        if (active) setLoadingEvent(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [eventId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm({ ...form, [target.name]: target.checked });
      return;
    }

    setForm({ ...form, [target.name]: target.value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setStatus("Maximum image size is 4MB.");
      return;
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    let coverImage = preview.startsWith("blob:") ? "" : preview;

    if (selectedImage) {
      const imageData = new FormData();
      imageData.append("file", selectedImage);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: imageData });
      const upload = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok) {
        setStatus(upload?.message || "Failed to upload the cover image.");
        setLoading(false);
        return;
      }

      coverImage = upload.url;
    }

    const payload = {
      title: form.title,
      venue: form.venue,
      date: form.date,
      description: form.description,
      coverImage,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      teamSize: Number(form.teamSize),
      qualifiersCount: Number(form.qualifiersCount),
      matchesPerTeamCap: Number(form.matchesPerTeamCap),
      eventFormat: form.eventFormat,
      registrationOpensAt: form.registrationOpensAt,
      registrationClosesAt: form.registrationClosesAt,
      isTest: form.isTest,
      testVisibleToUserIds: form.isTest ? form.testVisibleToUserIds : [],
    };

    const res = await fetch(isEdit ? `/api/events/${eventId}` : "/api/events", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (!res.ok) {
      setStatus(data?.message || "Something went wrong.");
      return;
    }

    router.push(isEdit ? `/admin/events/${eventId}` : "/admin/events");
    router.refresh();
  }

  if (isEdit && loadingEvent) {
    return (
      <div className={styles.container}>
        <p>Loading event...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={isEdit ? "Edit Event" : "Create New Event"}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Campus Events", href: "/admin/events" },
          { label: isEdit ? "Edit" : "Create Event" },
        ]}
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.imageSection}>
          <label>Event Cover Image (optional)</label>

          <input
            hidden
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
          />

          <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className={styles.preview} />
            ) : (
              <>
                <ImagePlus size={40} className={styles.uploadIcon} />
                <h3>Upload Event Cover</h3>
                <p>Click to upload</p>
                <small>JPG • PNG • WEBP</small>
              </>
            )}
          </div>

          {preview && (
            <button
              type="button"
              className={styles.removeImage}
              onClick={() => {
                setSelectedImage(null);
                setPreview("");
              }}
            >
              <X size={14} /> Remove Image
            </button>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Basic Details</div>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Event Name</span>
              <input
                name="title"
                placeholder="e.g. Tug of War"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Venue</span>
              <input
                name="venue"
                placeholder="e.g. Main Quad, SMI Campus"
                value={form.venue}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Event Date</span>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </label>

            <label className={styles.field}>
              <span>Max Participants (optional)</span>
              <small>Leave blank for no cap</small>
              <input
                type="number"
                name="maxParticipants"
                placeholder="e.g. 80"
                value={form.maxParticipants}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Teams & Tournament Format</div>
          <p className={styles.sectionHint}>
            Everyone registers individually — teams are formed physically on
            the day by chit picking, and the admin page just records who ends
            up on which team. These settings are planning targets (how many
            chits to print, which tournament shape to run) — pick the
            tournament format once final attendance is known; it's editable
            right up until teams are locked.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Target Players per Team</span>
              <small>Used to plan how many chits to print — not an automatic allocation</small>
              <input
                type="number"
                name="teamSize"
                min={2}
                value={form.teamSize}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Tournament Format</span>
              <select name="eventFormat" value={form.eventFormat} onChange={handleChange}>
                <option value="LEAGUE_KNOCKOUT">League + Knockout</option>
                <option value="DIRECT_KNOCKOUT">Direct Knockout</option>
              </select>
            </label>

            {form.eventFormat === "LEAGUE_KNOCKOUT" && (
              <>
                <label className={styles.field}>
                  <span>Max Group-Stage Matches per Team</span>
                  <small>Teams are grouped so nobody plays more than this many games</small>
                  <input
                    type="number"
                    name="matchesPerTeamCap"
                    min={2}
                    value={form.matchesPerTeamCap}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Teams That Qualify for Knockout</span>
                  <select name="qualifiersCount" value={form.qualifiersCount} onChange={handleChange}>
                    <option value="4">Top 4</option>
                    <option value="6">Top 6</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Schedule</div>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Registration Opens At</span>
              <input
                type="datetime-local"
                name="registrationOpensAt"
                value={form.registrationOpensAt}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Registration Closes At</span>
              <input
                type="datetime-local"
                name="registrationClosesAt"
                value={form.registrationClosesAt}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Description</div>

          <label className={styles.field}>
            <span>Event Description</span>
            <textarea
              name="description"
              placeholder="What is this event, and what should students know before registering?"
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Test Mode</div>
          <p className={styles.sectionHint}>
            A test event never appears on the public events list, and stays
            invisible to every student except the ones you pick below.
          </p>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="isTest" checked={form.isTest} onChange={handleChange} />
            This is a test event
          </label>

          {form.isTest && (
            <TestVisibilityPicker
              selectedIds={form.testVisibleToUserIds}
              onChange={(ids) => setForm({ ...form, testVisibleToUserIds: ids })}
            />
          )}
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={loading}>
          {loading ? (isEdit ? "Saving..." : "Creating Event...") : isEdit ? "Save Changes" : "Create Event"}
        </button>
      </form>
    </div>
  );
}
