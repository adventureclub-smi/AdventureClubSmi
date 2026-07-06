import styles from "./HeroOverlay.module.scss";

export default function HeroOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.gradient} />
      <div className={styles.vignette} />
      <div className={styles.grain} />
    </div>
  );
}
