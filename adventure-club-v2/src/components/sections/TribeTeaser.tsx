"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { TribeMemberSummary } from "@/data/tribe";
import styles from "./TribeTeaser.module.scss";

// Three.js touches the GPU/canvas — never render it on the server, and only
// pull the bundle in once the browser actually needs it (same isolation
// pattern as the other three.js scenes on this page).
const AmbientField = dynamic(() => import("@/components/three/AmbientField"), {
  ssr: false,
});

// A small teaser between Stories and the final CTA — not the full roster
// (that's the Tribe page itself), just enough of a preview to make "Meet
// The Tribe" feel like a real invitation rather than a blind link.
export default function TribeTeaser({ members }: { members: TribeMemberSummary[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Pauses the ambient field's render loop once scrolled well past this
  // section, instead of letting it run for the rest of the page's lifetime.
  const sceneInView = useInView(sectionRef, { margin: "300px" });

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 700);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  if (members.length === 0) return null;

  const preview = members.slice(0, 6);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.scene} aria-hidden="true">
        <AmbientField animate={!reducedMotion && sceneInView} isMobile={isMobile} density={0.8} />
      </div>

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
