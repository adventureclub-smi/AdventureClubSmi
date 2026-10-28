"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import TestVisibilityPicker from "@/components/admin/TestVisibilityPicker";
import styles from "./CreateTrekForm.module.scss";

type ActivityType = "WORKSHOP" | "SESSION";

type FormState = {
  activityType: ActivityType;
  title: string;
  place: string;
  time: string;
  duration: string;
  date: string;
  seats: string;
  description: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  isFree: boolean;
  price: string;
  isTest: boolean;
  testVisibleToUserIds: string[];
  reimbursementOffered: boolean;
  transportIncluded: boolean;
};

function buildEmptyForm(defaultActivityType: ActivityType): FormState {
  return {
    activityType: defaultActivityType,
    title: "",
    place: "",
    time: "",
    duration: "",
    date: "",
    seats: "",
    description: "",
    registrationOpensAt: "",
    registrationClosesAt: "",
    isFree: true,
    price: "",
    isTest: false,
    testVisibleToUserIds: [],
    reimbursementOffered: false,
    transportIncluded: false,
  };
}

// `.toISOString()` always returns UTC, but `<input type="date"/"datetime-local">`
// expects the value expressed in the browser's LOCAL time — same fix as
// CreateTrekForm's identical helpers.
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

export default function CreateWorkshopForm({
  workshopId,
  defaultActivityType = "WORKSHOP",
}: {
  workshopId?: string;
  defaultActivityType?: ActivityType;
}) {
  const router = useRouter();
  const isEdit = !!workshopId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingWorkshop, setLoadingWorkshop] = useState(isEdit);
  const [status, setStatus] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<FormState>(() => buildEmptyForm(defaultActivityType));

  useEffect(() => {
    if (!workshopId) return;

    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/treks/${workshopId}`);
        if (!res.ok || !active) return;

        const workshop = await res.json();

        setForm({
          activityType: workshop.activityType === "SESSION" ? "SESSION" : "WORKSHOP",
          title: workshop.title || "",
          place: workshop.destination || "",
          time: workshop.time || "",
          duration: workshop.duration || "",
          date: toDateInput(workshop.date),
          seats: String(workshop.seats ?? ""),
          description: workshop.description || "",
          registrationOpensAt: toDateTimeInput(workshop.registrationOpensAt),
          registrationClosesAt: toDateTimeInput(workshop.registrationClosesAt),
          isFree: (workshop.price ?? 0) === 0,
          price: workshop.price ? String(workshop.price) : "",
          isTest: workshop.isTest ?? false,
          testVisibleToUserIds: workshop.testVisibleToUserIds ?? [],
          reimbursementOffered: workshop.reimbursementOffered ?? false,
          transportIncluded: workshop.transportIncluded ?? false,
        });

        if (workshop.coverImage) setPreview(workshop.coverImage);
      } finally {
        if (active) setLoadingWorkshop(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [workshopId]);

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

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: imageData,
      });

      const upload = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok) {
        setStatus(
          upload?.message ||
            (uploadRes.status === 413
              ? "That image is too large for the server to accept. Please choose a smaller one."
              : "Failed to upload the cover image.")
        );
        setLoading(false);
        return;
      }

      coverImage = upload.url;
    }

    const payload = {
      activityType: form.activityType,
      title: form.title,
      place: form.place,
      time: form.time,
      duration: form.duration,
      date: form.date,
      seats: Number(form.seats),
      description: form.description,
      coverImage,
      registrationOpensAt: form.registrationOpensAt,
      registrationClosesAt: form.registrationClosesAt,
      isFree: form.isFree,
      price: form.isFree ? 0 : Number(form.price),
      isTest: form.isTest,
      testVisibleToUserIds: form.isTest ? form.testVisibleToUserIds : [],
      reimbursementOffered: form.reimbursementOffered,
      transportIncluded: form.transportIncluded,
    };

    const res = await fetch(isEdit ? `/api/workshops/${workshopId}` : "/api/workshops", {
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

    router.push("/admin/workshops");
    router.refresh();
  }

  if (isEdit && loadingWorkshop) {
    return (
      <div className={styles.container}>
        <p>Loading workshop...</p>
      </div>
    );
  }

  const eventWord = form.activityType === "SESSION" ? "Session" : "Workshop";

  return (
    <div className={styles.container}>
      <PageHeader
        title={isEdit ? `Edit ${eventWord}` : `Create New ${eventWord}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Workshops", href: "/admin/workshops" },
          { label: isEdit ? "Edit" : `Create ${eventWord}` },
        ]}
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Type</div>
          <p className={styles.sectionHint}>
            Both work exactly the same way under the hood (free entry rules,
            WhatsApp tab, admin tabs) — this just picks which word shows up
            for it (e.g. "Bird Watching" as a Session vs "Photography Basics"
            as a Workshop).
          </p>

          <div className={styles.row}>
            <label className={styles.checkboxLabel}>
              <input
                type="radio"
                name="activityType"
                checked={form.activityType === "WORKSHOP"}
                onChange={() => setForm({ ...form, activityType: "WORKSHOP" })}
              />
              Workshop
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="radio"
                name="activityType"
                checked={form.activityType === "SESSION"}
                onChange={() => setForm({ ...form, activityType: "SESSION" })}
              />
              Session
            </label>
          </div>
        </div>

        <div className={styles.imageSection}>
          <label>{eventWord} Cover Image (optional)</label>

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
                <h3>Upload {eventWord} Cover</h3>
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
              <span>{eventWord} Name</span>
              <input
                name="title"
                placeholder={form.activityType === "SESSION" ? "e.g. Bird Watching" : "e.g. Tent Pitching Basics"}
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Place</span>
              <input
                name="place"
                placeholder="e.g. Main Quad, SMI Campus"
                value={form.place}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Time</span>
              <input
                name="time"
                placeholder="e.g. 3:00 PM - 5:00 PM"
                value={form.time}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Duration</span>
              <input
                name="duration"
                placeholder="e.g. 2 Hours"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Schedule</div>
          <p className={styles.sectionHint}>
            Drives the same countdowns as treks: &ldquo;Registrations Open
            In&rdquo; counting down until registration opens, then
            &ldquo;Next Adventure In&rdquo; counting down to the {eventWord.toLowerCase()}
            date.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>{eventWord} Date</span>
              <small>The day the {eventWord.toLowerCase()} happens</small>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Registration Opens At</span>
              <small>When students can start registering</small>
              <input
                type="datetime-local"
                name="registrationOpensAt"
                value={form.registrationOpensAt}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Registration Closes At</span>
              <small>Deadline for new registrations</small>
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
          <div className={styles.sectionLabel}>Pricing & Seats</div>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Registration Type</span>
              <select
                name="isFree"
                value={form.isFree ? "free" : "paid"}
                onChange={(e) =>
                  setForm({ ...form, isFree: e.target.value === "free" })
                }
              >
                <option value="free">Free — just register</option>
                <option value="paid">Paid</option>
              </select>
            </label>

            {!form.isFree && (
              <label className={styles.field}>
                <span>Registration Fee (₹)</span>
                <input
                  type="number"
                  name="price"
                  placeholder="e.g. 100"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>
            )}

            <label className={styles.field}>
              <span>Total Seats</span>
              <input
                type="number"
                name="seats"
                placeholder="e.g. 40"
                value={form.seats}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Description</div>

          <label className={styles.field}>
            <span>{eventWord} Description</span>
            <textarea
              name="description"
              placeholder={`What will students learn/do at this ${eventWord.toLowerCase()}?`}
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Transport</div>
          <p className={styles.sectionHint}>
            Shown as a highlighted badge right on the registration page,
            before anyone signs up — students factor this into whether they
            need to sort their own way there and back.
          </p>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="transportIncluded"
              checked={form.transportIncluded}
              onChange={handleChange}
            />
            Transport is included for this {eventWord.toLowerCase()}
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>College Reimbursement</div>
          <p className={styles.sectionHint}>
            Most {eventWord.toLowerCase()}s don&apos;t get reimbursed by the college — leave
            this off and participants won&apos;t see any reimbursement
            status at all. Turn it on if this one does; the expected amount
            range can be set later from the Refunds tab.
          </p>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="reimbursementOffered"
              checked={form.reimbursementOffered}
              onChange={handleChange}
            />
            This {eventWord.toLowerCase()} offers college reimbursement
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Test Mode</div>
          <p className={styles.sectionHint}>
            A test {eventWord.toLowerCase()} never appears on the homepage or the public
            treks list, and stays invisible to every student except the ones
            you pick below — they&apos;ll see it on their own dashboard like
            any other {eventWord.toLowerCase()}. Admins always see it, tagged TEST.
          </p>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isTest"
              checked={form.isTest}
              onChange={handleChange}
            />
            This is a test {eventWord.toLowerCase()}
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
          {loading
            ? isEdit
              ? "Saving..."
              : `Creating ${eventWord}...`
            : isEdit
            ? "Save Changes"
            : `Create ${eventWord}`}
        </button>
      </form>
    </div>
  );
}
