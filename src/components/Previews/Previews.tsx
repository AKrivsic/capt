import styles from './Previews.module.css';

export default function Previews() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Style Previews</h2>
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.barbie}`}>✨ Living my dream life in pink 💖 #BarbieVibes</div>
        <div className={`${styles.card} ${styles.edgy}`}>⚡ Too glam to give a damn 🔥 #NoFilter</div>
        <div className={`${styles.card} ${styles.glamour}`}>💫 Elegance never goes out of style ✨ #GlamMode</div>
        <div className={`${styles.card} ${styles.fun}`}>🎉 Life&apos;s a party – dress like it! #OOTD</div>
        <div className={`${styles.card} ${styles.aesthetic}`}>🌸 Soft light, softer mood #AestheticFeed</div>
        <div className={`${styles.card} ${styles.minimalist}`}>🖤 Less but better. Always. #MinimalMood</div>
      </div>
    </section>
  );
}
