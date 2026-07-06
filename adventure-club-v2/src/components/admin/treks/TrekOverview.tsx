import { prisma } from "@/lib/prisma";
import styles from "./TrekOverview.module.scss";


interface Props {
  trekId: string;
}

export default async function TrekOverview({
  trekId,
}: Props) {
  const trek = await prisma.trek.findUnique({
    where: {
      id: trekId,
    },
    include: {
      registrations: true,
    },
  });

  if (!trek) {
    return <h2>Trek not found.</h2>;
  }

  const totalRegistrations = trek.registrations.length;

  const waiting = trek.registrations.filter(
  (r) => r.status === "WAITING"
).length;

const approved = trek.registrations.filter(
  (r) => r.status === "APPROVED"
).length;

const completed = trek.registrations.filter(
  (r) => r.status === "COMPLETED"
).length;

  return (
    <div className={styles.container}>
  
      <div className={styles.cards}>
        <div className={styles.card}>
          <h2>{trek.seats}</h2>
          <p>Total Seats</p>
        </div>

        <div className={styles.card}>
          <h2>{totalRegistrations}</h2>
          <p>Registrations</p>
        </div>

        <div className={styles.card}>
          <h2>{waiting}</h2>
          <p>Waiting</p>
        </div>

        <div className={styles.card}>
          <h2>{approved}</h2>
          <p>Approved</p>
        </div>

        <div className={styles.card}>
          <h2>{completed}</h2>
          <p>Completed</p>
        </div>
      </div>

      <div className={styles.info}>
        <h2>Trek Information</h2>

        <div className={styles.grid}>
          <div>
            <strong>Destination</strong>
            <p>{trek.destination}</p>
          </div>

          <div>
            <strong>Trail Type</strong>
            <p>{trek.trailType}</p>
          </div>

          <div>
            <strong>Difficulty</strong>
            <p>{trek.difficulty}</p>
          </div>

          <div>
            <strong>Altitude</strong>
            <p>{trek.altitude}</p>
          </div>

          <div>
            <strong>Duration</strong>
            <p>{trek.duration}</p>
          </div>

          <div>
            <strong>Distance</strong>
            <p>{trek.distance}</p>
          </div>

          <div>
            <strong>Trek Day</strong>
            <p>{trek.trekDay}</p>
          </div>

          <div>
            <strong>Date</strong>
            <p>{new Date(trek.date).toLocaleDateString()}</p>
          </div>

          <div>
            <strong>Total Cost</strong>
            <p>₹{trek.price}</p>
          </div>

          <div>
            <strong>Initial Payment</strong>
            <p>₹{trek.initialPayment}</p>
          </div>

          <div>
            <strong>Final Payment</strong>
            <p>₹{trek.finalPayment}</p>
          </div>
        </div>

        <div className={styles.description}>
          <strong>Description</strong>

          <p>{trek.description}</p>
        </div>
      </div>
    </div>
  );
}