"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CreateTrekForm.module.scss";

type FormState = {
  title: string;
  destination: string;
  difficulty: string;
  duration: string;
  date: string;
  season: string;
  price: string;
  initialPayment: string;
  finalPayment: string;
  participants: string;
  description: string;
};

const emptyForm: FormState = {
  title: "",
  destination: "",
  difficulty: "",
  duration: "",
  date: "",
  season: "2025-26",
  price: "",
  initialPayment: "",
  finalPayment: "",
  participants: "",
  description: "",
};

export default function CreateHistoricalTrekForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    const payload = {
      ...form,
      price: Number(form.price),
      initialPayment: Number(form.initialPayment),
      finalPayment: Number(form.finalPayment),
      seats: Number(form.participants) || 0,
    };

    const res = await fetch("/api/admin/historical-treks", {
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

    router.push(`/admin/treks/${data.trek.id}`);
    router.refresh();
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Add Historical Trek"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Treks", href: "/admin/treks" },
          { label: "Add Historical Trek" },
        ]}
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <Archive size={14} /> Archived Trek Record
          </div>
          <p className={styles.sectionHint}>
            For a trek that already happened, backfilled from last year&apos;s
            records. It won&apos;t appear in the current Treks list or any
            live-trek admin views — only in this season&apos;s archive tab.
            You can add participants, payments, refunds, and certificates
            from its own management page after creating it here.
          </p>

          <div className={styles.sectionGrid}>
            <label className={styles.field}>
              <span>Trek Title</span>
              <input
                name="title"
                placeholder="e.g. Kudremukh Trek"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Destination</span>
              <input
                name="destination"
                placeholder="e.g. Kudremukh, Karnataka"
                value={form.destination}
                onChange={handleChange}
                required
              />
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
              <span>Duration</span>
              <input
                name="duration"
                placeholder="e.g. 2 Days / 1 Night"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Trek Date</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Season</span>
              <small>Groups this trek into its archive tab</small>
              <input
                name="season"
                placeholder="e.g. 2025-26"
                value={form.season}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Pricing & Participants</div>

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
              <span>Initial Payment (₹)</span>
              <input
                type="number"
                name="initialPayment"
                placeholder="e.g. 500"
                value={form.initialPayment}
                onChange={handleChange}
                required
              />
            </label>

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

            <label className={styles.field}>
              <span>Number of Participants</span>
              <input
                type="number"
                name="participants"
                placeholder="e.g. 24"
                value={form.participants}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Description</div>

          <label className={styles.field}>
            <span>Trek Summary (optional)</span>
            <textarea
              name="description"
              placeholder="Any notes worth keeping on record for this trek"
              rows={4}
              value={form.description}
              onChange={handleChange}
            />
          </label>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Historical Trek"}
        </button>
      </form>
    </div>
  );
}
