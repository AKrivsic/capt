import styles from "./Hero.module.css"

export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heading}>Create unique captions in seconds</h1>
      <p className={styles.subtext}>Generate stylish captions for your posts effortlessly with AI</p>
      <button className={styles.btn}>Try Free</button>
      <div className={styles.card}>
        Soaking up the sunshine and good vibes ☀️ #SundayFunday
      </div>
    </section>
  );
}
