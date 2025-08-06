import styles from "./Benefits.module.css";

export default function Benefits() {
  return (
    <section className={styles.benefits} id="benefits">
      <h2 className={styles.heading}>Benefits</h2>
      <ul className={styles.list}>
        <li className={styles.item}>✨ Effortless style</li>
        <li className={styles.item}>⏱️ Save time</li>
        <li className={styles.item}>📈 Boost your reach</li>
        <li className={styles.item}>🧠 Personalized by AI</li>
      </ul>
    </section>
  );
}
