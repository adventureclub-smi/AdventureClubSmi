import styles from "./StatusBadge.module.scss";

export type StatusTone =
  | "waiting"
  | "approved"
  | "open"
  | "rejected"
  | "waitlist"
  | "completed"
  | "success"
  | "danger"
  | "neutral";

const toneClass: Record<StatusTone, string> = {
  waiting: styles.waiting,
  approved: styles.success,
  open: styles.success,
  rejected: styles.danger,
  waitlist: styles.waiting,
  completed: styles.neutral,
  success: styles.success,
  danger: styles.danger,
  neutral: styles.neutral,
};

export default function StatusBadge({
  text,
  tone,
}: {
  text: string;
  tone: StatusTone;
}) {
  return <span className={`${styles.badge} ${toneClass[tone]}`}>{text}</span>;
}
