"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Clock } from "lucide-react";
import styles from "./page.module.scss";

export default function PaymentSubmittedPage() {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.icon}>
          <PartyPopper size={48} />
        </div>

        <h1>Payment Submitted</h1>

        <p>Your payment proof has been submitted successfully.</p>

        <div className={styles.status}>
          <h3>
            <Clock size={18} /> Waiting for Verification
          </h3>
          <p>The Adventure Club will verify your payment shortly.</p>
        </div>

        <Link href="/dashboard" className={styles.button}>
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
