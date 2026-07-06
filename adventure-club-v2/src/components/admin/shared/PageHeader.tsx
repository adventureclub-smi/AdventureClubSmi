import Link from "next/link";
import { ChevronRight } from "lucide-react";
import styles from "./PageHeader.module.scss";

type Crumb = { label: string; href?: string };

export default function PageHeader({
  title,
  breadcrumb,
  quickActions,
}: {
  title: string;
  breadcrumb?: Crumb[];
  quickActions?: React.ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className={styles.breadcrumb}>
            {breadcrumb.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className={styles.crumb}>
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {i < breadcrumb.length - 1 && <ChevronRight size={13} />}
              </span>
            ))}
          </div>
        )}

        <h1>{title}</h1>
      </div>

      {quickActions && <div className={styles.actions}>{quickActions}</div>}
    </div>
  );
}
