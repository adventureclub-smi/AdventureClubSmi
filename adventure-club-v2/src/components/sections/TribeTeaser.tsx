"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { TribeMemberSummary } from "@/data/tribe";
import styles from "./TribeTeaser.module.scss";

// A small teaser between Stories and the final CTA — not the full roster
// (that's the Tribe page itself), just enough of a preview to make "Meet
// The Tribe" feel like a real invitation rather than a blind link.
export default function TribeTeaser({ members }: { members: TribeMemberSummary[] }) {
  if (members.length === 0) return null;

  const preview = members.slice(0, 6);

  return (
    <section className={styles.section}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className={styles.avatars} aria-hidden="true">
          {preview.map((member, i) => (
            <div
              key={member.id}
              className={styles.avatar}
              style={{ zIndex: preview.length - i }}
            >
              <Image src={member.photoUrl} alt="" fill sizes="56px" />
            </div>
          ))}
        </div>

        <span className={styles.eyebrow}>THE TEAM</span>
        <h2>Meet The Tribe</h2>
        <p>
          The crew behind every climb — the people who plan, guide, and run
          every trek.
        </p>

        <Link href="/tribe" className={styles.cta}>
          View The Tribe
          <ArrowRight size={16} />
        </Link>
      </motion.div>
    </section>
  );
}
