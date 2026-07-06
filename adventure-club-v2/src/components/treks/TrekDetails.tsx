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

type Trek = {
  id: string;
  title: string;
  destination: string;
  date: string | Date;
  coverImage?: string | null;
  description: string;
  price: number;
  initialPayment: number;
  finalPayment: number;
  difficulty: string;
  duration: string;
  registrationClosesAt?: string | Date | null;
};

type Registration = {
  id: string;
  status: string;
  initialPaymentDeadline?: string | Date | null;
};

export default function TrekDetails({
  trek,
  user,
  registration,
}: {
  trek: Trek;
  user: { id: string } | null;
  registration: Registration | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p>{trek.destination}</p>
          <h1>{trek.title}</h1>
          <span>{new Date(trek.date).toLocaleDateString("en-IN")}</span>
        </motion.div>
      </section>

      <section className={styles.main}>
        <motion.div
          className={styles.left}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>About Expedition</h2>
          <p>{trek.description}</p>
        </motion.div>

        <motion.div
          className={styles.right}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.price}>
            <h2>₹{trek.price}</h2>
            <span>Total Trek Fee</span>
          </div>

          <div className={styles.payments}>
            <div>
              <p>Initial Payment</p>
              <h3>₹{trek.initialPayment}</h3>
            </div>

            <div>
              <p>Final Payment</p>
              <h3>₹{trek.finalPayment}</h3>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.details}>
            <div>
              <span>
                <CalendarDays size={14} /> Date
              </span>
              <strong>{new Date(trek.date).toLocaleDateString("en-IN")}</strong>
            </div>

            <div>
              <span>
                <Mountain size={14} /> Difficulty
              </span>
              <strong>{trek.difficulty}</strong>
            </div>

            <div>
              <span>
                <MapPin size={14} /> Destination
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

          {!user && (
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

          {user && !registration && (
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

          {registration?.status === "APPROVED" && (
            <>
              {registration.initialPaymentDeadline && (
                <PaymentCountdown deadline={registration.initialPaymentDeadline} />
              )}

              <Link
                href={`/student/payments/${registration.id}`}
                className={styles.registerButton}
              >
                <Wallet size={16} /> Pay Initial Payment ₹{trek.initialPayment}
              </Link>

              <p className={styles.note}>
                Your registration has been approved. Complete the initial
                payment before the countdown ends to confirm your seat.
              </p>
            </>
          )}

          {registration?.status === "REJECTED" && (
            <>
              <div className={styles.badgeRow}>
                <StatusBadge text="Registration Rejected" tone="danger" />
              </div>
              <p className={styles.note}>
                Please contact Adventure Club for more details.
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
