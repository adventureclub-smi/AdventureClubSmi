"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mountain,
  Tent,
  Waves,
  Camera,
  Flame,
  Footprints,
  Pickaxe,
} from "lucide-react";

import styles from "./ActivityCard.module.scss";

interface Props {
  title: string;
  description: string;
  image: string;
  large?: boolean;
}

const icons = {
  Trekking: Mountain,
  Camping: Tent,
  Kayaking: Waves,
  Bouldering: Pickaxe,
  "Trail Running": Footprints,
  Photography: Camera,
  "Bonfire Nights": Flame,
};

export default function ActivityCard({
  title,
  description,
  image,
  large = false,
}: Props) {
  const Icon = icons[title as keyof typeof icons] || Mountain;

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.03,
      }}
      transition={{ duration: 0.35 }}
      className={`${styles.card} ${large ? styles.large : ""}`}
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width:768px) 100vw, 33vw"
        className={styles.image}
      />

      <div className={styles.overlay} />

      <div className={styles.content}>
        <Icon
          size={34}
          strokeWidth={2.3}
          className={styles.icon}
        />

        <h3>{title}</h3>

        <div className={styles.line} />

        <p>{description}</p>
      </div>
    </motion.div>
  );
}