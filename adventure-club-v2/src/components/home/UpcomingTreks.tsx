import { prisma } from "@/lib/prisma";
import TrekCard from "./TrekCard";
import styles from "./UpcomingTreks.module.scss";

export default async function UpcomingTreks() {
  const treks = await prisma.trek.findMany({
    where: {
      date: {
        gte: new Date(),
      },
      status: "Registration Open",
    },
    orderBy: {
      date: "asc",
    },
  });

  if (treks.length === 0) {
    return (
      <section className={styles.container}>
        <div className={styles.header}>
          <p className={styles.tag}>
            Upcoming Adventures
          </p>

          <h2>No Upcoming Treks</h2>

          <p className={styles.subtitle}>
            New adventures will appear here once the
            admin publishes them.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <p className={styles.tag}>
          Upcoming Adventures
        </p>

        <h2>Choose Your Next Trek</h2>

        <p className={styles.subtitle}>
          Every adventure begins with a single step.
          Discover our upcoming treks and reserve
          your spot.
        </p>
      </div>

      <div className={styles.grid}>
        {treks.map((trek) => (
          <TrekCard
            key={trek.id}
            trek={{
              id: trek.id,
              title: trek.title,
              destination: trek.destination,
              difficulty: trek.difficulty,
              date: trek.date.toISOString(),
              price: trek.price,
              coverImage:
                trek.coverImage ||
                "/images/default-trek.jpg",
            }}
          />
        ))}
      </div>
    </section>
  );
}