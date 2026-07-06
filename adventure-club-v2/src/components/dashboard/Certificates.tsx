"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, CalendarDays } from "lucide-react";

import BackButton from "./shared/BackButton";
import styles from "./Certificates.module.scss";

type Certificate = {
  registrationId: string;
  trekId: string;
  trekTitle: string;
  trekDate: string;
  certificateUrl: string | null;
  issuedAt: string | null;
};

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/student/certificates");
        if (!active) return;
        if (res.ok) setCertificates(await res.json());
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.container}>
      <BackButton />

      <h1>Certificates</h1>
      <p className={styles.subtitle}>
        Certificates earned for treks you&apos;ve completed with Adventure Club.
      </p>

      {loading ? (
        <p className={styles.empty}>Loading certificates...</p>
      ) : certificates.length === 0 ? (
        <div className={styles.empty}>
          <Award size={40} />
          <p>No certificates issued yet.</p>
          <span>Complete a trek to earn your first certificate.</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.registrationId}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
            >
              <div className={styles.icon}>
                <Award size={24} />
              </div>

              <h3>{cert.trekTitle}</h3>

              <p className={styles.meta}>
                <CalendarDays size={13} />{" "}
                {new Date(cert.trekDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {cert.certificateUrl ? (
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.download}
                >
                  <Download size={15} /> Download Certificate
                </a>
              ) : (
                <span className={styles.pending}>Certificate file pending upload</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
