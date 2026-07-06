"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./About.module.scss";

export default function About() {
  return (
    <section className={styles.about} id="about">
      <div className={styles.container}>

        {/* LEFT */}

        <motion.div
          className={styles.images}
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: .8 }}
          viewport={{ once: true }}
        >
          <div className={styles.largeImage}>
            <Image
  src="/images/about/about-4.jpg"
  alt=""
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className={styles.image}
/>
          </div>

          <div className={styles.smallImages}>

            <div className={styles.small}>
              <Image
                src="/images/about/about-5.jpg"
                alt=""
                fill
                className={styles.image}
              />
            </div>

            <div className={styles.small}>
              <Image
                src="/images/about/about-1.jpg"
                alt=""
                fill
                className={styles.image}
              />
            </div>

          </div>
        </motion.div>

        {/* RIGHT */}

        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: .8 }}
          viewport={{ once: true }}
        >

          <span className={styles.eyebrow}>
            WHO WE ARE
          </span>

          <h2 className={styles.title}>
            Adventure Begins
            <br />
            Beyond The Classroom.
          </h2>

          <p className={styles.description}>
            Adventure Club SMI is a community of explorers,
            creators and outdoor enthusiasts who believe the
            best classroom is nature itself. From mountain
            summits and forest camps to rivers and bonfires,
            every experience builds confidence, teamwork and
            unforgettable memories.
          </p>

          <div className={styles.stats}>

            <div>
              <h3>100+</h3>
              <p>Members</p>
            </div>

            <div>
              <h3>25+</h3>
              <p>Events</p>
            </div>

            <div>
              <h3>5+</h3>
              <p>Activities</p>
            </div>

          </div>

        </motion.div>

      </div>
    </section>
  );
}