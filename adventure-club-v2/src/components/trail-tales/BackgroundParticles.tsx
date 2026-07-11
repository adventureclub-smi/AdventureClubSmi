"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./BackgroundParticles.module.scss";

const PARTICLE_COUNT = 26;

type Particle = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

export default function BackgroundParticles() {
  // Random values must not be generated during the initial render — the
  // server and client renders would pick different numbers and React would
  // flag a hydration mismatch. Generating them client-side after mount avoids
  // that; the brief empty frame is invisible against the particles' own fade-in.
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this is the client-only random generation itself, there's no external system to synchronize with.
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 10 + Math.random() * 12,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 60,
      }))
    );
  }, []);

  return (
    <div className={styles.field} aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ y: "105vh", opacity: 0, x: 0 }}
          animate={{
            y: "-10vh",
            opacity: [0, 0.8, 0.8, 0],
            x: p.drift,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
