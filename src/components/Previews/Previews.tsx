"use client";
import styles from "./Previews.module.css";

export default function Previews() {
  return (
    <section className={styles.section} id="previews">
      <h2 className={styles.heading}>Style Previews</h2>
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.barbie}`} data-aos="fade-up">
          <p className={styles.caption}>✨ Living my dream life in pink 💖</p>
          <p className={styles.desc}>Barbie – sweet, playful, iconic</p>
        </div>
        <div className={`${styles.card} ${styles.edgy}`} data-aos="fade-up">
          <p className={styles.caption}>⚡ Too glam to give a damn 🔥</p>
          <p className={styles.desc}>Edgy – bold, fearless, cool</p>
        </div>
        <div className={`${styles.card} ${styles.glamour}`} data-aos="fade-up">
          <p className={styles.caption}>💫 Elegance never goes out of style</p>
          <p className={styles.desc}>Glamour – luxury, shine, glow</p>
        </div>
        <div className={`${styles.card} ${styles.fun}`} data-aos="fade-up">
          <p className={styles.caption}>🎉 Life&apos;s a party – dress like it!</p>
          <p className={styles.desc}>Fun – energy, party, wild vibes</p>
        </div>
        <div className={`${styles.card} ${styles.aesthetic}`} data-aos="fade-up">
          <p className={styles.caption}>🌸 Soft light, softer mood</p>
          <p className={styles.desc}>Aesthetic – dreamy, vintage, soft</p>
        </div>
        <div className={`${styles.card} ${styles.minimalist}`} data-aos="fade-up">
          <p className={styles.caption}>🖤 Less but better. Always.</p>
          <p className={styles.desc}>Minimalist – clean, calm, subtle</p>
        </div>
      </div>
    </section>
  );
}

