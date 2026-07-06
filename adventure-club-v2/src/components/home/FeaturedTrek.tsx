import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./FeaturedTrek.module.scss";

export default async function FeaturedTrek() {
  const trek = await prisma.trek.findFirst({
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

  if (!trek) return null;

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          <Image
            src={
              trek.coverImage ||
              "/images/default-trek.jpg"
            }
            alt={trek.title}
            fill
            className={styles.image}
          />

          <div className={styles.overlay} />
        </div>

        <div className={styles.content}>
          <p className={styles.tag}>
            NEXT ADVENTURE
          </p>

          <h2>{trek.title}</h2>

          <p className={styles.location}>
            📍 {trek.destination}
          </p>

          <div className={styles.info}>
            <div>
              <span>Difficulty</span>

              <h4>{trek.difficulty}</h4>
            </div>

            <div>
              <span>Date</span>

              <h4>
                {new Date(
                  trek.date
                ).toLocaleDateString()}
              </h4>
            </div>

            <div>
              <span>Price</span>

              <h4>₹{trek.price}</h4>
            </div>
          </div>

          <p className={styles.description}>
            {trek.description.length > 220
              ? trek.description.slice(0, 220) +
                "..."
              : trek.description}
          </p>

          <Link
            href={`/treks/${trek.id}`}
            className={styles.button}
          >
            Explore Trek →
          </Link>
        </div>
      </div>
    </section>
  );
}