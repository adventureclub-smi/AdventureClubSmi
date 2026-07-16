"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CreateTrekForm.module.scss";

type FormState = {
  title: string;
  destination: string;
  trailType: string;
  difficulty: string;
  altitude: string;
  duration: string;
  distance: string;
  trekDay: string;
  date: string;
  price: string;
  installments: "1" | "2";
  initialPayment: string;
  finalPayment: string;
  seats: string;
  description: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  distanceKm: string;
  altitudeMeters: string;
  campNights: string;
  countsAsPeak: boolean;
  latitude: string;
  longitude: string;
};

const emptyForm: FormState = {
  title: "",
  destination: "",
  trailType: "",
  difficulty: "",
  altitude: "",
  duration: "",
  distance: "",
  trekDay: "",
  date: "",
  price: "",
  installments: "2",
  initialPayment: "",
  finalPayment: "",
  seats: "",
  description: "",
  registrationOpensAt: "",
  registrationClosesAt: "",
  distanceKm: "",
  altitudeMeters: "",
  campNights: "",
  countsAsPeak: true,
  latitude: "",
  longitude: "",
};

// `.toISOString()` always returns UTC, but `<input type="date"/"datetime-local">`
// expects the value expressed in the browser's LOCAL time — using toISOString()
// here shifted the displayed time by the timezone offset (e.g. -5:30 for IST)
// every time the edit form reloaded, even though the correct instant was saved.
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

export default function CreateTrekForm({ trekId }: { trekId?: string }) {
  const router = useRouter();
  const isEdit = !!trekId;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingTrek, setLoadingTrek] = useState(isEdit);
  const [status, setStatus] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!trekId) return;

    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/treks/${trekId}`);
        if (!res.ok || !active) return;

        const trek = await res.json();

        setForm({
          title: trek.title || "",
          destination: trek.destination || "",
          trailType: trek.trailType || "",
          difficulty: trek.difficulty || "",
          altitude: trek.altitude || "",
          duration: trek.duration || "",
          distance: trek.distance || "",
          trekDay: trek.trekDay || "",
          date: toDateInput(trek.date),
          price: String(trek.price ?? ""),
          installments: trek.installments === 1 ? "1" : "2",
          initialPayment: String(trek.initialPayment ?? ""),
          finalPayment: String(trek.finalPayment ?? ""),
          seats: String(trek.seats ?? ""),
          description: trek.description || "",
          registrationOpensAt: toDateTimeInput(trek.registrationOpensAt),
          registrationClosesAt: toDateTimeInput(trek.registrationClosesAt),
          distanceKm: String(trek.distanceKm ?? ""),
          altitudeMeters: String(trek.altitudeMeters ?? ""),
          campNights: String(trek.campNights ?? ""),
          countsAsPeak: trek.countsAsPeak ?? true,
          latitude: trek.latitude != null ? String(trek.latitude) : "",
          longitude: trek.longitude != null ? String(trek.longitude) : "",
        });

        if (trek.coverImage) setPreview(trek.coverImage);
      } finally {
        if (active) setLoadingTrek(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

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

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Maximum image size is 5MB.");
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

      const upload = await uploadRes.json();

      if (!uploadRes.ok) {
        setStatus(upload.message);
        setLoading(false);
        return;
      }

      coverImage = upload.url;
    }

    const payload = {
      ...form,
      coverImage,
      price: Number(form.price),
      initialPayment: Number(form.initialPayment),
      finalPayment: Number(form.finalPayment),
      seats: Number(form.seats),
      distanceKm: Number(form.distanceKm) || 0,
      altitudeMeters: Number(form.altitudeMeters) || 0,
      campNights: Number(form.campNights) || 0,
      countsAsPeak: form.countsAsPeak,
    };

    const res = await fetch(isEdit ? `/api/treks/${trekId}` : "/api/treks", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setStatus(data.message || "Something went wrong.");
      return;
    }

    router.push("/admin/treks");
    router.refresh();
  }

  if (loadingTrek) {
    return <div className={styles.container}>Loading trek...</div>;
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title={isEdit ? "Edit Trek" : "Create New Trek"}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Treks", href: "/admin/treks" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.imageSection}>
          <label>Trek Cover Image</label>

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
                <h3>Upload Trek Cover</h3>
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
              <span>Trek Title</span>
              <input
                name="title"
                placeholder="e.g. Skandagiri Sunrise Trek"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Destination</span>
              <input
                name="destination"
                placeholder="e.g. Skandagiri, Karnataka"
                value={form.destination}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Trail Type</span>
              <select name="trailType" value={form.trailType} onChange={handleChange} required>
                <option value="">Select Trail Type</option>
                <option>Out & Back</option>
                <option>Loop</option>
                <option>Point to Point</option>
                <option>Circuit</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Difficulty</span>
              <select name="difficulty" value={form.difficulty} onChange={handleChange} required>
                <option value="">Select Difficulty</option>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Hard</option>
                <option>Extreme</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Altitude</span>
              <input
                name="altitude"
                placeholder="e.g. 1450 m"
                value={form.altitude}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Duration</span>
              <input
                name="duration"
                placeholder="e.g. 1 Day / 8 Hours"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Distance</span>
              <input
                name="distance"
                placeholder="e.g. 16 km"
                value={form.distance}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Day of Trek</span>
              <select name="trekDay" value={form.trekDay} onChange={handleChange} required>
                <option value="">Select Day</option>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Schedule</div>
          <p className={styles.sectionHint}>
            Drives the homepage countdowns: it shows &ldquo;Registrations Open
            In&rdquo; counting down to the date below until registration
            opens, then switches to &ldquo;Next Adventure In&rdquo; counting
            down to the Trek Date.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Trek Date</span>
              <small>The day the trek actually happens</small>
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
              <span>Total Trek Cost (₹)</span>
              <input
                type="number"
                name="price"
                placeholder="e.g. 1200"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Payment Installments</span>
              <small>
                Some treks only ever collect one payment instead of an
                initial + final split
              </small>
              <select name="installments" value={form.installments} onChange={handleChange}>
                <option value="2">2 Installments (Initial + Final)</option>
                <option value="1">1 Installment (Full Payment)</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>{form.installments === "1" ? "Full Payment (₹)" : "Initial Payment (₹)"}</span>
              <input
                type="number"
                name="initialPayment"
                placeholder="e.g. 500"
                value={form.initialPayment}
                onChange={handleChange}
                required
              />
            </label>

            {form.installments !== "1" && (
              <label className={styles.field}>
                <span>Final Payment (₹)</span>
                <input
                  type="number"
                  name="finalPayment"
                  placeholder="e.g. 700"
                  value={form.finalPayment}
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
            <span>Trek Description</span>
            <textarea
              name="description"
              placeholder="What makes this trek worth joining?"
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Portfolio Automation</div>

          <div className={styles.portfolioGrid}>
            <label className={styles.field}>
              <span>Distance (km)</span>
              <input
                type="number"
                step="0.1"
                name="distanceKm"
                placeholder="e.g. 16"
                value={form.distanceKm}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Altitude (m)</span>
              <input
                type="number"
                name="altitudeMeters"
                placeholder="e.g. 1450"
                value={form.altitudeMeters}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Camp Nights</span>
              <input
                type="number"
                name="campNights"
                placeholder="e.g. 1"
                value={form.campNights}
                onChange={handleChange}
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="countsAsPeak"
                checked={form.countsAsPeak}
                onChange={handleChange}
              />
              Counts as Peak
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Map Location</div>
          <p className={styles.sectionHint}>
            Coordinates for this trek&apos;s pin on the homepage trek map.
            Leave blank if you don&apos;t have them yet — the trek just
            won&apos;t show a pin until they&apos;re added.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Latitude</span>
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="e.g. 13.3702"
                value={form.latitude}
                onChange={handleChange}
              />
            </label>

            <label className={styles.field}>
              <span>Longitude</span>
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="e.g. 77.6835"
                value={form.longitude}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? isEdit
              ? "Saving Changes..."
              : "Creating Trek..."
            : isEdit
            ? "Save Changes"
            : "Create Trek"}
        </button>
      </form>
    </div>
  );
}
