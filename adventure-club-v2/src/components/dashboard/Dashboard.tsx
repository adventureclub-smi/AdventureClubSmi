"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Wallet,
  Award,
  Sparkles,
  User,
  Mountain,
  Bell,
  Images,
} from "lucide-react";

import HeroSection from "./HeroSection";
import NextTrekCard from "./NextTrekCard";
import Stats from "./Stats";
import QuickActionCard from "./shared/QuickActionCard";
import {
  getJourneyAction,
  type RegistrationLike,
} from "@/lib/registration-journey";

import styles from "./Dashboard.module.scss";

type HeroData = {
  name: string;
  clubId: string;
  membership: string;
  role: string;
  bannerImageUrl: string | null;
};

type NextTrekEntry = {
  trek: {
    id: string;
    title: string;
    destination: string;
    date: string;
    difficulty: string;
    price: number;
    initialPayment: number;
    coverImage?: string;
  };

  registration: RegistrationLike | null;

  registrationState?: "NOT_OPEN" | "OPEN" | "CLOSED";

  registrationOpensAt?: string | null;

  notifyRequested?: boolean;

};

type MyRegistration = RegistrationLike & { trek: { id: string } };

export default function Dashboard() {
  const [hero, setHero] =
    useState<HeroData | null>(null);

  const [nextTreks, setNextTreks] = useState<NextTrekEntry[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [heroRes, trekRes, registrationsRes] = await Promise.all([
          fetch("/api/dashboard/hero"),
          fetch("/api/dashboard/next-trek"),
          fetch("/api/my-registrations"),
        ]);

        if (!active) return;

        if (heroRes.ok) {
          setHero(await heroRes.json());
        }

        if (trekRes.ok) {
          const data = await trekRes.json();
          setNextTreks(data?.entries ?? []);
        }

        if (registrationsRes.ok) {
          setRegistrations(await registrationsRes.json());
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  // The "next trek" the hero/current-trek card focuses on is always the
  // soonest-dated trek, which may not be the one the student is actually
  // registered for. Trip Centre stays reachable for a registration for its
  // entire post-launch lifecycle (through attendance/certificate), so
  // `trek.tripCentrePublished` — the same flag the trip-centre API itself
  // gates on — is the right check, not the single "current" journey action.
  // Once a trek is wrapped up (COMPLETED/MISSED via the admin's "Mark Trek
  // Completed" action), it's no longer "active" — stop surfacing its Trip
  // Centre here so the CTA disappears until the student's next registration.
  const activeTripCentreReg = registrations.find(
    (registration) =>
      registration.initialPaymentPaid &&
      registration.trek.tripCentrePublished &&
      registration.status !== "COMPLETED" &&
      registration.status !== "MISSED"
  );

  const activeTripCentreHref = activeTripCentreReg
    ? `/student/trip-centre/${activeTripCentreReg.id}`
    : null;

  // Multiple simultaneous registrations can each be at a different journey
  // stage — rather than stacking a full card per trek, the student picks
  // which one to view via the tabs above the card, defaulting to the
  // soonest-dated trek (entries already arrive sorted that way). The hero
  // banner's CTA follows that same selection.
  const selectedEntry =
    nextTreks.find((entry) => entry.trek.id === selectedTrekId) || nextTreks[0];

  const tripCentreAction = selectedEntry?.trek
    ? getJourneyAction(
        selectedEntry.trek.id,
        selectedEntry.registration,
        selectedEntry.registrationState
      )
    : null;

  const tripCentreHref =
    activeTripCentreHref ||
    (tripCentreAction?.variant === "tripCentre" ? tripCentreAction.href : null);

  return (
    <div className={styles.main}>
      {hero && (
        <HeroSection
          name={hero.name}
          clubId={hero.clubId}
          membership={hero.membership}
          role={hero.role}
          bannerImageUrl={hero.bannerImageUrl}
          tripCentreHref={tripCentreHref}
        />
      )}

      {selectedEntry && (
        <div>
          {nextTreks.length > 1 && (
            <div className={styles.trekTabs}>
              {nextTreks.map((entry) => (
                <button
                  key={entry.trek.id}
                  type="button"
                  className={
                    entry.trek.id === selectedEntry.trek.id
                      ? styles.trekTabActive
                      : styles.trekTab
                  }
                  onClick={() => setSelectedTrekId(entry.trek.id)}
                >
                  {entry.trek.title}
                </button>
              ))}
            </div>
          )}

          <NextTrekCard
            key={selectedEntry.trek.id}
            trek={selectedEntry.trek}
            registration={selectedEntry.registration}
            registrationState={selectedEntry.registrationState}
            registrationOpensAt={selectedEntry.registrationOpensAt}
            notifyRequested={selectedEntry.notifyRequested}
          />
        </div>
      )}

      <Stats />

      <section>
        <h2 className={styles.quickActionsHeading}>Quick Actions</h2>

        <div className={styles.quickActionsGrid}>
          <QuickActionCard
            icon={Compass}
            label="Trip Centre"
            href={tripCentreHref || "/dashboard/my-registrations"}
          />
          <QuickActionCard
            icon={Wallet}
            label="Payments"
            href="/dashboard/my-registrations"
          />
          <QuickActionCard
            icon={Award}
            label="Certificates"
            href="/dashboard/certificates"
          />
          <QuickActionCard
            icon={Sparkles}
            label="Portfolio"
            href="/dashboard/portfolio"
          />
          <QuickActionCard icon={User} label="Profile" href="/dashboard/profile" />
          <QuickActionCard
            icon={Mountain}
            label="Upcoming Treks"
            href="/dashboard/treks"
          />
          <QuickActionCard
            icon={Bell}
            label="Announcements"
            href="/dashboard/announcements"
          />
          <QuickActionCard
            icon={Images}
            label="Gallery"
            href="#"
            comingSoon
          />
        </div>
      </section>
    </div>
  );
}