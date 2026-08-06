import { Megaphone } from "lucide-react";
import styles from "./AnnouncementTicker.module.scss";

// Renders nothing at all whenever there's no active announcement — no
// empty bar taking up space between the hero and the stats section.
export default function AnnouncementTicker({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className={styles.ticker}>
      <div className={styles.label}>
        <span className={styles.dot} />
        <Megaphone size={13} />
        Announcement
      </div>

      <div className={styles.scroll}>
        <div className={styles.track}>
          {/* Two identical copies is what makes this loop seamlessly — the
              animation only ever moves the track left by exactly one copy's
              width (via translateX(-50%) on a track that's exactly two
              copies wide), so the moment the first copy scrolls fully off,
              the second is sitting in the exact position the first started
              in. */}
          <span className={styles.item}>{message}</span>
          <span className={styles.item} aria-hidden="true">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
