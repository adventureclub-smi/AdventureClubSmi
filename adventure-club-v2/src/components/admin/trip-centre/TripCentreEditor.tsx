"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Backpack,
  Bus,
  ChevronDown,
  Clock,
  CloudSun,
  EyeOff,
  Map,
  MapPin,
  MessageCircle,
  Radio,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./TripCentreEditor.module.scss";

type TripCentreForm = {
  meetingPoint: string;
  meetingTime: string;
  transportDetails: string;
  weatherNote: string;
  whatsappGroupLink: string;
  emergencyNumber: string;
  itinerary: string;
  leaderMessage: string;
  reportingInstructions: string;
  requiredItems: string;
  optionalItems: string;
  tripCentrePublished: boolean;
};

type TripSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const initialForm: TripCentreForm = {
  meetingPoint: "",
  meetingTime: "",
  transportDetails: "",
  weatherNote: "",
  whatsappGroupLink: "",
  emergencyNumber: "",
  itinerary: "",
  leaderMessage: "",
  reportingInstructions: "",
  requiredItems: "",
  optionalItems: "",
  tripCentrePublished: false,
};

function TripSection({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
}: TripSectionProps) {
  return (
    <details className={styles.section} open={defaultOpen}>
      <summary>
        <span className={styles.sectionIcon}>
          <Icon size={18} />
        </span>

        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>

        <ChevronDown className={styles.chevron} size={18} />
      </summary>

      <div className={styles.sectionBody}>{children}</div>
    </details>
  );
}

export default function TripCentreEditor({ trekId }: { trekId: string }) {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Not saved this session");

  const [form, setForm] = useState<TripCentreForm>(initialForm);

  useEffect(() => {
    fetch(`/api/admin/trip-centre/${trekId}`)
      .then((res) => res.json())
      .then((data) =>
        setForm({
          meetingPoint: data.meetingPoint || "",

          meetingTime: data.meetingTime
            ? data.meetingTime.slice(0, 16)
            : "",

          transportDetails: data.transportDetails || "",

          weatherNote: data.weatherNote || "",

          whatsappGroupLink: data.whatsappGroupLink || "",

          emergencyNumber: data.emergencyNumber || "",

          itinerary: data.itinerary || "",

          leaderMessage: data.leaderMessage || "",

          reportingInstructions: data.reportingInstructions || "",

          requiredItems: data.requiredItems?.join("\n") || "",

          optionalItems: data.optionalItems?.join("\n") || "",

          tripCentrePublished: data.tripCentrePublished ?? false,
        })
      );
  }, [trekId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function persist(next: TripCentreForm) {
    const res = await fetch(`/api/admin/trip-centre/${trekId}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        ...next,

        requiredItems: next.requiredItems.split("\n").filter(Boolean),

        optionalItems: next.optionalItems.split("\n").filter(Boolean),
      }),
    });

    return res.ok;
  }

  async function togglePublish() {
    const previous = form;
    const next = { ...form, tripCentrePublished: !form.tripCentrePublished };

    setForm(next);
    setPublishing(true);

    const ok = await persist(next);

    setPublishing(false);

    if (ok) {
      setLastUpdated(new Date().toLocaleString());
    } else {
      setForm(previous);
      alert("Failed to update Trip Centre status.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const ok = await persist(form);

    setLoading(false);

    if (ok) {
      setLastUpdated(new Date().toLocaleString());
      alert("Trip Centre Updated!");
    } else {
      alert("Failed to update.");
    }
  }

  const requiredCount = useMemo(
    () => form.requiredItems.split("\n").filter(Boolean).length,
    [form.requiredItems]
  );

  const optionalCount = useMemo(
    () => form.optionalItems.split("\n").filter(Boolean).length,
    [form.optionalItems]
  );

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.topRow}>
        <div>
          <h3>Trip Centre Briefing</h3>
          <p>
            Reporting, transport, safety, weather, packing, and live group
            details for the student-facing Trip Centre.
          </p>
        </div>

        <div className={styles.statusActions}>
          <StatusBadge
            text={form.tripCentrePublished ? "Published" : "Draft"}
            tone={form.tripCentrePublished ? "success" : "neutral"}
          />

          <button
            type="button"
            onClick={togglePublish}
            disabled={publishing}
            className={
              form.tripCentrePublished
                ? styles.unpublishButton
                : styles.publishButton
            }
          >
            {publishing ? (
              <>{form.tripCentrePublished ? "Unpublishing..." : "Publishing..."}</>
            ) : form.tripCentrePublished ? (
              <>
                <EyeOff size={15} />
                Unpublish
              </>
            ) : (
              <>
                <Radio size={15} />
                Launch Trip Centre
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <Clock size={18} />
          <div>
            <strong>
              {form.meetingTime
                ? new Date(form.meetingTime).toLocaleString()
                : "TBA"}
            </strong>
            <span>Meeting Time</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <MapPin size={18} />
          <div>
            <strong>{form.meetingPoint || "TBA"}</strong>
            <span>Meeting Point</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <Sparkles size={18} />
          <div>
            <strong>{lastUpdated}</strong>
            <span>Last Updated</span>
          </div>
        </div>
      </div>

      <div className={styles.sections}>
        <TripSection
          icon={MapPin}
          title="Reporting Details"
          description="Meeting point, time, and arrival instructions."
        >
          <label>
            Meeting Point
            <input
              name="meetingPoint"
              placeholder="Meeting Point"
              value={form.meetingPoint}
              onChange={handleChange}
            />
          </label>

          <label>
            Meeting Time
            <input
              type="datetime-local"
              name="meetingTime"
              value={form.meetingTime}
              onChange={handleChange}
            />
          </label>

          <label className={styles.full}>
            Reporting Instructions
            <textarea
              rows={5}
              name="reportingInstructions"
              placeholder="Reporting Instructions"
              value={form.reportingInstructions}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={Bus}
          title="Transport"
          description="Departure, pickup, vehicle, and route notes."
        >
          <label className={styles.full}>
            Transport Details
            <textarea
              rows={5}
              name="transportDetails"
              placeholder="Transport Details"
              value={form.transportDetails}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={CloudSun}
          title="Weather"
          description="Expected conditions and trail-specific advice."
        >
          <label className={styles.full}>
            Weather Information
            <textarea
              rows={4}
              name="weatherNote"
              placeholder="Weather Information"
              value={form.weatherNote}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={MessageCircle}
          title="Leader Message"
          description="A short note from the trek leader."
        >
          <label className={styles.full}>
            Leader Message
            <textarea
              rows={5}
              name="leaderMessage"
              placeholder="Leader Message"
              value={form.leaderMessage}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={Map}
          title="Trek Itinerary"
          description="Day plan, checkpoints, and expected flow."
        >
          <label className={styles.full}>
            Itinerary
            <textarea
              rows={8}
              name="itinerary"
              placeholder="Itinerary"
              value={form.itinerary}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={Backpack}
          title="Packing Checklist"
          description={`${requiredCount} required and ${optionalCount} optional items.`}
        >
          <div className={styles.packingGrid}>
            <label>
              Required
              <textarea
                rows={10}
                name="requiredItems"
                placeholder="One item per line"
                value={form.requiredItems}
                onChange={handleChange}
              />
            </label>

            <label>
              Optional
              <textarea
                rows={10}
                name="optionalItems"
                placeholder="One item per line"
                value={form.optionalItems}
                onChange={handleChange}
              />
            </label>
          </div>
        </TripSection>

        <TripSection
          icon={AlertTriangle}
          title="Emergency Contact"
          description="The number students can call during the trek."
        >
          <label className={styles.full}>
            Emergency Number
            <input
              name="emergencyNumber"
              placeholder="Emergency Number"
              value={form.emergencyNumber}
              onChange={handleChange}
            />
          </label>
        </TripSection>

        <TripSection
          icon={Send}
          title="WhatsApp"
          description="Official trip group link for approved students."
        >
          <label className={styles.full}>
            WhatsApp Group Link
            <input
              name="whatsappGroupLink"
              placeholder="WhatsApp Group Link"
              value={form.whatsappGroupLink}
              onChange={handleChange}
            />
          </label>
        </TripSection>
      </div>

      <div className={styles.saveBar}>
        <div>
          <strong>
            {form.tripCentrePublished ? "Published Trip Centre" : "Draft Trip Centre"}
          </strong>
          <span>Changes are saved only when you press the button.</span>
        </div>

        <button className={styles.saveButton} disabled={loading}>
          <Save size={16} />
          {loading ? "Saving..." : "Save Trip Centre"}
        </button>
      </div>
    </form>
  );
}
