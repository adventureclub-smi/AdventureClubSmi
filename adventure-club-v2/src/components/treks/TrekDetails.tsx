"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Mountain, MapPin, Clock, Wallet } from "lucide-react";

import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./TrekDetails.module.scss";
import PaymentCountdown from "./PaymentCountdown";
import {
  getJourneyAction,
  registrationStateForViewer,
  type RegistrationLike,
  type JourneyAction,
} from "@/lib/registration-journey";
import { isCoreTeamRole } from "@/lib/core-team-roles";
import { isYearEligible } from "@/lib/year-eligibility";

type Trek = {
  id: string;
  title: string;
  destination: string;
  date: string | Date;
  coverImage?: string | null;
  description: string;
  price: number;
  installments: number;
  initialPayment: number;
  finalPayment: number;
  difficulty: string;
  duration: string;
  registrationClosesAt?: string | Date | null;
  registrationOpensAt?: string | Date | null;
  registrationOpenedManually?: boolean;
  registrationClosedManually?: boolean;
  registrationOpenForCoreOnly?: boolean;
  tripCentrePublished?: boolean;
  type?: string;
  time?: string | null;
  expectedReimbursementMin?: number | null;
  expectedReimbursementMax?: number | null;
  restrictedYears?: string[];
};

type Registration = RegistrationLike;

// registration.status === "APPROVED" covers everything from "just approved,
// hasn't paid yet" through "fully paid and out on the trip" — this maps that
// single status to the same next-step copy the dashboard already shows via
// getJourneyAction, so this page can't drift back into showing "Pay Initial
// Payment" for someone who's already paid (see getJourneyAction's variants).
function journeyActionNote(variant: JourneyAction["variant"], isSingleInstallment: boolean) {
  switch (variant) {
    case "pay":
      return `Your registration has been approved. Complete the ${
        isSingleInstallment ? "payment" : "initial payment"
      } before the countdown ends to confirm your seat.`;
    case "finalPay":
      return "Your final payment is now open — complete it to lock in your spot.";
    case "tripCentre":
      return "Head to your Trip Centre for the meeting point, WhatsApp group, and trip details.";
    case "certificate":
      return "Your certificate is ready to download.";
    default:
      return "Check your dashboard for what's next in your journey.";
  }
}

export default function TrekDetails({
  trek,
  user,
  registration,
  notifyRequested,
}: {
  trek: Trek;
  user: { id: string; clubRole: string; year: string } | null;
  registration: Registration | null;
  notifyRequested: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [notified, setNotified] = useState(notifyRequested);
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Any clubRole other than Member/Registered Member/Participant/Pending —
  // matches the admin's "Open for Core Members" toggle.
  const isCoreTeamMember = !!user && isCoreTeamRole(user.clubRole);

  // Same NOT_OPEN/OPEN/CLOSED precedence the dashboard/homepage use — a
  // manual "Close Registrations" override must beat the countdown dates
  // here too, otherwise this page keeps offering Register Now (and even
  // lets the registration POST succeed) after an admin has closed it.
  const registrationState = registrationStateForViewer(
    {
      ...trek,
      registrationOpenedManually: !!trek.registrationOpenedManually,
      registrationClosedManually: !!trek.registrationClosedManually,
      registrationOpenForCoreOnly: !!trek.registrationOpenForCoreOnly,
    },
    isCoreTeamMember
  );

  // Cosmetic-only, same as registrationState above — the real gate is the
  // registrations POST route, this just avoids showing a Register button
  // that would just come back with a rejection message.
  const isYearRestricted = !!user && !isYearEligible(user.year, trek.restrictedYears);

  const isWorkshop = trek.type === "WORKSHOP";
  const isFree = trek.price === 0;

  // registration.status alone only tells you "approved" — it stays
  // APPROVED all the way through paid/verified/attended/certified, so the
  // actual next step (still owes initial payment vs. already paid and
  // waiting on trip centre vs. final payment due, etc.) has to come from
  // the same payment-aware logic the dashboard uses, not from status alone.
  const journeyAction: JourneyAction | null =
    registration?.status === "APPROVED" && !isFree
      ? getJourneyAction(trek.id, {
          ...registration,
          trek: { installments: trek.installments, tripCentrePublished: trek.tripCentrePublished },
        })
      : null;

  async function handleNotifyMe() {
    setNotifyLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/treks/${trek.id}/notify`, { method: "POST" });
      const data = await res.json();

      setStatus(data.message);
      if (res.ok) setNotified(true);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }

    setNotifyLoading(false);
  }

  async function handleRegister() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId: trek.id }),
      });

      const data = await res.json();
      setStatus(data.message);

      if (res.ok) router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <>
      <section className={styles.hero}>
        <Image
          src={trek.coverImage || "/images/default-trek.jpg"}
          alt={trek.title}
          fill
          priority
          className={styles.image}
        />

        <div className={styles.overlay} />

        <div className={styles.content}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p>{trek.destination}</p>
            <h1>{trek.title}</h1>
            <span>{new Date(trek.date).toLocaleDateString("en-IN")}</span>

            <small className={styles.transportNote}>
              Transportation from MAHE Gate 3 and forest permit included.
            </small>
          </motion.div>
        </div>
      </section>

      <section className={styles.main}>
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>{isWorkshop ? "About This Workshop" : "About Expedition"}</h2>
          <p>{trek.description}</p>
        </motion.div>

        <motion.div
          className={styles.right}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.price}>
            <h2>{isFree ? "Free" : `₹${trek.price}`}</h2>
            <span>{isWorkshop ? "Workshop Fee" : "Total Trek Fee"}</span>
          </div>

          {!isFree && (
            <div className={styles.payments}>
              {trek.installments === 1 ? (
                <div>
                  <p>Full Payment</p>
                  <h3>₹{trek.initialPayment}</h3>
                </div>
              ) : (
                <>
                  <div>
                    <p>Initial Payment</p>
                    <h3>₹{trek.initialPayment}</h3>
                  </div>

                  <div>
                    <p>Final Payment</p>
                    <h3>₹{trek.finalPayment}</h3>
                  </div>
                </>
              )}
            </div>
          )}

          {(trek.expectedReimbursementMin != null || trek.expectedReimbursementMax != null) && (
            <div className={styles.reimbursementNote}>
              <Wallet size={14} />
              <span>
                Expected college reimbursement: ₹{trek.expectedReimbursementMin ?? "?"}–₹
                {trek.expectedReimbursementMax ?? "?"}
              </span>
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.details}>
            <div>
              <span>
                <CalendarDays size={14} /> Date
              </span>
              <strong>{new Date(trek.date).toLocaleDateString("en-IN")}</strong>
            </div>

            {trek.time && (
              <div>
                <span>
                  <Clock size={14} /> Time
                </span>
                <strong>{trek.time}</strong>
              </div>
            )}

            {!isWorkshop && (
              <div>
                <span>
                  <Mountain size={14} /> Difficulty
                </span>
                <strong>{trek.difficulty}</strong>
              </div>
            )}

            <div>
              <span>
                <MapPin size={14} /> {isWorkshop ? "Place" : "Destination"}
              </span>
              <strong>{trek.destination}</strong>
            </div>

            <div>
              <span>
                <Clock size={14} /> Duration
              </span>
              <strong>{trek.duration}</strong>
            </div>
          </div>

          {status && <p className={styles.status}>{status}</p>}

          {!registration && registrationState === "NOT_OPEN" && (
            <>
              {trek.registrationOpensAt && (
                <PaymentCountdown
                  deadline={trek.registrationOpensAt}
                  heading="Registrations Open Soon"
                  subheading="Registrations open in"
                  expiredHeading="Registrations Opening"
                  expiredMessage="Registrations are about to open — check back shortly."
                />
              )}

              {!user ? (
                <>
                  <Link href="/login" className={styles.registerButton}>
                    Login to Get Notified
                  </Link>
                  <p className={styles.note}>
                    Login now so you&apos;re ready the moment registrations open.
                  </p>
                </>
              ) : notified ? (
                <div className={styles.badgeRow}>
                  <StatusBadge text="We'll Email You" tone="waiting" />
                </div>
              ) : (
                <>
                  <button
                    onClick={handleNotifyMe}
                    disabled={notifyLoading}
                    className={styles.registerButton}
                  >
                    {notifyLoading ? "Saving..." : "Notify Me When Registrations Open"}
                  </button>
                  <p className={styles.note}>
                    We&apos;ll email you as soon as registrations open.
                  </p>
                </>
              )}
            </>
          )}

          {!registration && registrationState === "CLOSED" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registrations Closed" tone="danger" />
              </div>
              <p className={styles.note}>
                Registrations for this trek are currently closed.
              </p>
            </>
          )}

          {!user && registrationState === "OPEN" && (
            <>
              {trek.registrationClosesAt && (
                <PaymentCountdown
                  deadline={trek.registrationClosesAt}
                  heading="Registration Closing Soon"
                  subheading="Registration closes in"
                  expiredHeading="Registrations Closed"
                  expiredMessage="Registrations for this trek are now closed."
                />
              )}

              <Link href="/login" className={styles.registerButton}>
                Login to Register
              </Link>
              <p className={styles.note}>Login to continue your registration.</p>
            </>
          )}

          {user && !registration && registrationState === "OPEN" && isYearRestricted && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Not Open For Your Year" tone="danger" />
              </div>
              <p className={styles.note}>
                This trek is only open to {trek.restrictedYears?.join(", ")}{" "}
                students.
              </p>
            </>
          )}

          {user && !registration && registrationState === "OPEN" && !isYearRestricted && (
            <>
              {trek.registrationClosesAt && (
                <PaymentCountdown
                  deadline={trek.registrationClosesAt}
                  heading="Registration Closing Soon"
                  subheading="Registration closes in"
                  expiredHeading="Registrations Closed"
                  expiredMessage="Registrations for this trek are now closed."
                />
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className={styles.registerButton}
              >
                {loading ? "Registering..." : "Register Now"}
              </button>
              <p className={styles.note}>
                Click Register to submit your registration request.
              </p>
            </>
          )}

          {registration?.status === "WAITING" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Already Registered" tone="waiting" />
              </div>
              <p className={styles.note}>
                Your registration has been submitted successfully.
                <br />
                Awaiting admin approval.
              </p>
            </>
          )}

          {registration?.status === "APPROVED" && isFree && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registered — Free Entry" tone="approved" />
              </div>
              <p className={styles.note}>
                Your registration has been approved. No payment needed — see
                you there!
              </p>
            </>
          )}

          {registration?.status === "APPROVED" && !isFree && journeyAction && (
            <>
              {journeyAction.variant === "pay" && registration.initialPaymentDeadline && (
                <PaymentCountdown deadline={registration.initialPaymentDeadline} />
              )}

              {journeyAction.href ? (
                <Link href={journeyAction.href} className={styles.registerButton}>
                  <Wallet size={16} />{" "}
                  {journeyAction.text}
                  {journeyAction.variant === "pay" && ` ₹${trek.initialPayment}`}
                  {journeyAction.variant === "finalPay" && ` ₹${trek.finalPayment}`}
                </Link>
              ) : (
                <div className={styles.badgeRow}>
                  <StatusBadge text={journeyAction.text} tone="waiting" />
                </div>
              )}

              <p className={styles.note}>
                {journeyActionNote(journeyAction.variant, trek.installments === 1)}
              </p>
            </>
          )}

          {registration?.status === "REJECTED" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registration Rejected" tone="danger" />
              </div>
              <p className={styles.note}>
                Please contact NAVIRA for more details.
              </p>
            </>
          )}

          {registration?.status === "TIMED_OUT" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registration Timed Out" tone="danger" />
              </div>
              <p className={styles.note}>
                Your registration was denied as you didn&apos;t pay the
                initial payment in time. Please contact NAVIRA for more
                details.
              </p>
            </>
          )}

          {registration?.status === "WAITLIST" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Waitlisted" tone="waiting" />
              </div>
              <p className={styles.note}>
                You&apos;re currently on the waiting list. We&apos;ll notify
                you if a seat becomes available.
              </p>
            </>
          )}

          <div className={styles.divider} />

          <div className={styles.navActions}>
            {user && (
              <Link href="/dashboard" className={styles.navButton}>
                Back to Student Dashboard
              </Link>
            )}

            <Link href="/" className={styles.navButton}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
