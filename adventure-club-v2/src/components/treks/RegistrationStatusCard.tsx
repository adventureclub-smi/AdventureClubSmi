import Link from "next/link";
import styles from "./RegistrationStatusCard.module.scss";

export default function RegistrationStatusCard({
  user,
  registration,
  trek,
  loading,
  onRegister,
}: {
  user: any;
  registration: any;
  trek: any;
  loading: boolean;
  onRegister: () => void;
}) {
  if (!user) {
    return (
      <Link
        href="/login"
        className={styles.button}
      >
        Login to Register
      </Link>
    );
  }

  if (!registration) {
    return (
      <button
        onClick={onRegister}
        disabled={loading}
        className={styles.button}
      >
        {loading ? "Registering..." : "Register Now"}
      </button>
    );
  }

  if (registration.status === "WAITING") {
    return (
      <div className={styles.card}>
        <span className={styles.waiting}>
          🟡 Waiting For Approval
        </span>

        <p>
          Your registration has been received.
          The Adventure Club will review your
          request soon.
        </p>
      </div>
    );
  }

  if (registration.status === "APPROVED") {
    return (
      <div className={styles.card}>
        <span className={styles.approved}>
          🟢 Registration Approved
        </span>

        <p>
          Congratulations! Your seat has been
          reserved.
        </p>

        <div className={styles.payment}>
          <h3>Initial Payment</h3>

          <h2>₹{trek.initialPayment}</h2>

          <button className={styles.button}>
            Pay Initial Amount
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.success}>
        🎉 You're officially registered!
      </span>

      <p>
        Your seat has been confirmed for this
        trek.
      </p>

      <div className={styles.info}>
        <p>
          📍 Meeting Point:
          <strong> {trek.meetingPoint}</strong>
        </p>

        <p>
          🕒 Reporting Time:
          <strong>
            {" "}
            {trek.meetingTime
              ? new Date(
                  trek.meetingTime
                ).toLocaleString("en-IN")
              : "TBA"}
          </strong>
        </p>

        <p>
          📞 Emergency Contact:
          <strong>
            {" "}
            {trek.emergencyNumber ||
              "Will be announced"}
          </strong>
        </p>
      </div>

      {trek.whatsappGroupLink && (
        <a
          href={trek.whatsappGroupLink}
          target="_blank"
          className={styles.button}
        >
          Join WhatsApp Group
        </a>
      )}
    </div>
  );
}