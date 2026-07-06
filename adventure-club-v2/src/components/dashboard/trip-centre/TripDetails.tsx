"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Backpack,
  Bus,
  Check,
  CloudSun,
  Compass,
  ExternalLink,
  Flag,
  MapPin,
  Megaphone,
  MessageCircle,
  Mountain,
  Navigation,
  Phone,
  Route,
  ShieldAlert,
  Timer,
} from "lucide-react";

import BackButton from "@/components/dashboard/shared/BackButton";
import { useCountdown } from "@/hooks/useCountdown";
import styles from "./TripDetails.module.scss";

const FAR_FUTURE = "2099-01-01T00:00:00.000Z";

type Trek = {
  title: string;
  destination: string;
  date: string;
  coverImage?: string | null;
  difficulty?: string | null;
  distance?: string | null;
  altitude?: string | null;
  duration?: string | null;
  trailType?: string | null;
  transportDetails?: string | null;
  meetingPoint?: string | null;
  meetingTime?: string | null;
  reportingInstructions?: string | null;
  emergencyNumber?: string | null;
  weatherNote?: string | null;
  whatsappGroupLink?: string | null;
  itinerary?: string | null;
  leaderMessage?: string | null;
  requiredItems?: string[];
  optionalItems?: string[];
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "To Be Announced";
}

function splitItinerary(value?: string | null) {
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function TripDetails({ trekId }: { trekId: string }) {
  const storageKey = `trip-checklist-${trekId}`;

  const [loading, setLoading] = useState(true);
  const [trek, setTrek] = useState<Trek | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [trekRes, announcementRes] = await Promise.all([
          fetch(`/api/trip-centre/${trekId}`),
          fetch(`/api/student/trip-announcements/${trekId}`),
        ]);

        if (!active) return;

        if (trekRes.ok) setTrek(await trekRes.json());
        if (announcementRes.ok) setAnnouncements(await announcementRes.json());

        const saved = localStorage.getItem(storageKey);
        if (saved) setCheckedItems(JSON.parse(saved));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId, storageKey]);

  const meetingTime = trek?.meetingTime;
  const countdownState = useCountdown(meetingTime || FAR_FUTURE);
  const countdown =
    meetingTime && countdownState.passed
      ? "Reporting Time!"
      : meetingTime
      ? `${countdownState.days}d ${countdownState.hours}h ${countdownState.minutes}m`
      : "";

  function toggleItem(item: string) {
    const updated = checkedItems.includes(item)
      ? checkedItems.filter((i) => i !== item)
      : [...checkedItems, item];

    setCheckedItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  const totalItems = useMemo(() => {
    if (!trek) return 0;

    return (trek.requiredItems?.length || 0) + (trek.optionalItems?.length || 0);
  }, [trek]);

  const progress = useMemo(() => {
    if (totalItems === 0) return 0;

    return Math.round((checkedItems.length / totalItems) * 100);
  }, [checkedItems, totalItems]);

  if (loading) return <div className={styles.loading}>Loading trip centre...</div>;

  if (!trek) return <div className={styles.loading}>Trip Centre unavailable.</div>;

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    trek.meetingPoint || ""
  )}`;
  const itineraryItems = splitItinerary(trek.itinerary);

  return (
    <div className={styles.container}>
      <div className={styles.backButton}>
        <BackButton />
      </div>

      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(13,13,13,.92), rgba(13,13,13,.65), rgba(13,13,13,.2)), url(${
            trek.coverImage || "/images/about/about-5.JPG"
          })`,
        }}
      >
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Trip Centre</p>
          <h1>{trek.title}</h1>
          <p>
            Your trek briefing, packing plan, updates, contacts, and reporting
            details in one place.
          </p>

          <div className={styles.heroBadges}>
            <span>
              <Timer size={17} strokeWidth={1.75} />
              {countdown || "Reporting TBA"}
            </span>
            <span>
              <CloudSun size={17} strokeWidth={1.75} />
              Weather Updated
            </span>
            <span>
              <Mountain size={17} strokeWidth={1.75} />
              {trek.difficulty || "Difficulty TBA"}
            </span>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.countdownCard}>
            <small>Reporting starts in</small>
            <strong>{countdown || "TBA"}</strong>
          </div>

          <div className={styles.heroMetrics}>
            <div>
              <span>Distance</span>
              <strong>{trek.distance || "TBA"}</strong>
            </div>
            <div>
              <span>Altitude</span>
              <strong>{trek.altitude || "TBA"}</strong>
            </div>
            <div>
              <span>Meeting Point</span>
              <strong>{trek.meetingPoint || "TBA"}</strong>
            </div>
            <div>
              <span>Packing</span>
              <strong>{progress}%</strong>
            </div>
          </div>

          <div className={styles.progressTrack}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      </motion.section>

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <MapPin size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Reporting Details</p>
                <h2>Arrival Plan</h2>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div>
                <small>Meeting Point</small>
                <strong>{trek.meetingPoint || "TBA"}</strong>
              </div>

              <div>
                <small>Meeting Time</small>
                <strong>{formatDateTime(trek.meetingTime)}</strong>
              </div>
            </div>

            <p className={styles.bodyText}>
              {trek.reportingInstructions ||
                "Reporting instructions will be updated soon."}
            </p>

            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapButton}
            >
              <Navigation size={17} strokeWidth={1.75} />
              Open Google Maps
            </a>
          </section>

          <div className={styles.infoGrid}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <span>
                  <Bus size={21} strokeWidth={1.75} />
                </span>
                <div>
                  <p>Transport</p>
                  <h2>Departure</h2>
                </div>
              </div>
              <p className={styles.bodyText}>
                {trek.transportDetails || "Transport details coming soon."}
              </p>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <span>
                  <CloudSun size={21} strokeWidth={1.75} />
                </span>
                <div>
                  <p>Weather</p>
                  <h2>Trail Conditions</h2>
                </div>
              </div>
              <p className={styles.bodyText}>
                {trek.weatherNote || "Weather update coming soon."}
              </p>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <span>
                  <MessageCircle size={21} strokeWidth={1.75} />
                </span>
                <div>
                  <p>Leader Message</p>
                  <h2>Trek Lead Note</h2>
                </div>
              </div>
              <p className={styles.bodyText}>
                {trek.leaderMessage || "Leader message will appear here."}
              </p>

              <div className={styles.actionRow}>
                {trek.whatsappGroupLink ? (
                  <a href={trek.whatsappGroupLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={16} strokeWidth={1.75} />
                    WhatsApp
                  </a>
                ) : null}

                {trek.emergencyNumber ? (
                  <a href={`tel:${trek.emergencyNumber}`}>
                    <Phone size={16} strokeWidth={1.75} />
                    Call
                  </a>
                ) : null}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <span>
                  <ShieldAlert size={21} strokeWidth={1.75} />
                </span>
                <div>
                  <p>Emergency</p>
                  <h2>Immediate Contact</h2>
                </div>
              </div>

              {trek.emergencyNumber ? (
                <a className={styles.emergencyCall} href={`tel:${trek.emergencyNumber}`}>
                  <Phone size={18} strokeWidth={1.75} />
                  {trek.emergencyNumber}
                </a>
              ) : (
                <p className={styles.bodyText}>Emergency number coming soon.</p>
              )}
            </section>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Compass size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Trip Information</p>
                <h2>Trek Profile</h2>
              </div>
            </div>

            <div className={styles.profileGrid}>
              <div>
                <small>Difficulty</small>
                <strong>{trek.difficulty || "TBA"}</strong>
              </div>
              <div>
                <small>Distance</small>
                <strong>{trek.distance || "TBA"}</strong>
              </div>
              <div>
                <small>Altitude</small>
                <strong>{trek.altitude || "TBA"}</strong>
              </div>
              <div>
                <small>Duration</small>
                <strong>{trek.duration || "TBA"}</strong>
              </div>
              <div>
                <small>Trail Type</small>
                <strong>{trek.trailType || "TBA"}</strong>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Route size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Trek Itinerary</p>
                <h2>Trail Timeline</h2>
              </div>
            </div>

            {itineraryItems.length > 0 ? (
              <div className={styles.timeline}>
                {itineraryItems.map((item, index) => (
                  <div key={`${item}-${index}`} className={styles.timelineItem}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.bodyText}>Itinerary will be updated soon.</p>
            )}
          </section>
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Megaphone size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Live Announcements</p>
                <h2>Updates</h2>
              </div>
            </div>

            <div className={styles.announcementList}>
              {announcements.length === 0 ? (
                <div className={styles.empty}>No announcements yet.</div>
              ) : (
                announcements.map((item, index) => (
                  <article key={item.id} className={styles.feedItem}>
                    <div>
                      <strong>{item.title}</strong>
                      {index === 0 && <span>NEW</span>}
                    </div>

                    <p>{item.message}</p>

                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Backpack size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Packing Progress</p>
                <h2>{progress}% Ready</h2>
              </div>
            </div>

            <div className={styles.progressTrack}>
              <div style={{ width: `${progress}%` }} />
            </div>

            <p className={styles.packingCount}>
              {checkedItems.length} of {totalItems} items packed
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Flag size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Quick Actions</p>
                <h2>Open Fast</h2>
              </div>
            </div>

            <div className={styles.quickActions}>
              {trek.whatsappGroupLink ? (
                <a
                  className={styles.whatsapp}
                  href={trek.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} strokeWidth={1.75} />
                  Join WhatsApp
                </a>
              ) : null}

              {trek.emergencyNumber ? (
                <a href={`tel:${trek.emergencyNumber}`}>
                  <AlertTriangle size={18} strokeWidth={1.75} />
                  Call Emergency
                </a>
              ) : null}

              <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} strokeWidth={1.75} />
                Open Maps
              </a>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span>
                <Backpack size={21} strokeWidth={1.75} />
              </span>
              <div>
                <p>Packing Checklist</p>
                <h2>Required</h2>
              </div>
            </div>

            <div className={styles.checklist}>
              {(trek.requiredItems || []).map((item) => (
                <label key={item} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleItem(item)}
                  />
                  <span>
                    <Check size={15} strokeWidth={1.75} />
                  </span>
                  {item}
                </label>
              ))}
            </div>

            <h3 className={styles.optionalTitle}>Optional</h3>

            <div className={styles.checklist}>
              {(trek.optionalItems || []).map((item) => (
                <label key={item} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleItem(item)}
                  />
                  <span>
                    <Check size={15} strokeWidth={1.75} />
                  </span>
                  {item}
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.mobileActions}>
        {trek.whatsappGroupLink && (
          <a href={trek.whatsappGroupLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} strokeWidth={1.75} />
            WhatsApp
          </a>
        )}

        {trek.emergencyNumber && (
          <a href={`tel:${trek.emergencyNumber}`}>
            <AlertTriangle size={16} strokeWidth={1.75} />
            Emergency
          </a>
        )}

        <a href={mapsHref} target="_blank" rel="noopener noreferrer">
          <Navigation size={16} strokeWidth={1.75} />
          Maps
        </a>
      </div>
    </div>
  );
}
