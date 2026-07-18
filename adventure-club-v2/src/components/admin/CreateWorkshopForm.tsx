"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CreateTrekForm.module.scss";

type FormState = {
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
};

const emptyForm: FormState = {
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
};

export default function CreateWorkshopForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);

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

    let coverImage = "";

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
    };

    const res = await fetch("/api/workshops", {
      method: "POST",
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

  return (
    <div className={styles.container}>
      <PageHeader
        title="Create New Workshop"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Treks", href: "/admin/treks" },
          { label: "Create Workshop" },
        ]}
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.imageSection}>
          <label>Workshop Cover Image (optional)</label>

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
                <h3>Upload Workshop Cover</h3>
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
              <span>Workshop Name</span>
              <input
                name="title"
                placeholder="e.g. Tent Pitching Basics"
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
            &ldquo;Next Adventure In&rdquo; counting down to the workshop
            date.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Workshop Date</span>
              <small>The day the workshop happens</small>
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
            <span>Workshop Description</span>
            <textarea
              name="description"
              placeholder="What will students learn/do at this workshop?"
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating Workshop..." : "Create Workshop"}
        </button>
      </form>
    </div>
  );
}
