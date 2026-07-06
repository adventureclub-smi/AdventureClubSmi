"use client";

import { motion } from "framer-motion";
import ActivityCard from "@/components/ui/ActivityCard";
import styles from "./Activities.module.scss";

const activities = [
  {
    title: "Trekking",
    description:
      "Explore breathtaking mountain trails and conquer new summits.",
    image: "/images/activities/trekking.jpg",
  },
  {
    title: "Camping",
    description:
      "Sleep beneath the stars and wake up to unforgettable sunrises.",
    image: "/images/activities/camping.jpg",
  },
  {
    title: "Kayaking",
    description:
      "Navigate rivers and embrace adventure from the water.",
    image: "/images/activities/kayaking.jpg",
  },
  {
    title: "Bouldering",
    description:
      "Challenge yourself on natural rock formations.",
    image: "/images/activities/bouldering.jpg",
  },
  {
    title: "Trail Running",
    description:
      "Run where the road ends and nature begins.",
    image: "/images/activities/trail-running.jpg",
  },
  {
    title: "Photography",
    description:
      "Capture breathtaking landscapes and unforgettable moments.",
    image: "/images/activities/photography.jpg",
  },
  {
    title: "Bonfire Nights",
    description:
      "Stories, music and laughter beneath a sky full of stars.",
    image: "/images/activities/bonfire.jpg",
  },
];

export default function Activities() {
  return (
    <section className={styles.activities} id="activities">
      <div className={styles.container}>
        {/* Heading */}

        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span>WHAT WE DO</span>

          <h2>
            EVERY ADVENTURE
            <br />
            HAS A STORY.
          </h2>

          <p>
            From mountain trails to rivers, campfires and climbing
            walls, every adventure pushes you beyond the ordinary.
          </p>
        </motion.div>

        {/* First Row */}

        <div className={styles.grid}>
          {activities.slice(0, 3).map((activity) => (
            <ActivityCard
              key={activity.title}
              {...activity}
            />
          ))}
        </div>

        {/* Second Row */}

        <div className={styles.grid}>
          {activities.slice(3, 6).map((activity) => (
            <ActivityCard
              key={activity.title}
              {...activity}
            />
          ))}
        </div>

        {/* Bonfire */}

        <div className={styles.bottom}>
          <div className={styles.largeCard}>
            <ActivityCard
              {...activities[6]}
              large
            />
          </div>
        </div>
      </div>
    </section>
  );
}