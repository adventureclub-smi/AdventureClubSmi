"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

export default function BackButton({
  href = "/dashboard",
  label = "Back to Dashboard",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} className={styles.back}>
      <ArrowLeft size={18} strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}
