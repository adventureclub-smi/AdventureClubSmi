"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/treks/[id]/layout.module.scss";

type Tab = {
  title: string;
  href: string;
};

export default function TrekTabs({
  tabs,
}: {
  tabs: Tab[];
}) {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname === tab.href ? styles.active : ""}
        >
          {tab.title}
        </Link>
      ))}
    </nav>
  );
}