import styles from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={styles.cta}>
      <h2 className={styles.heading}>Ready to boost your content?</h2>
      <p className={styles.subheading}>Start generating AI-powered captions in seconds.</p>
      <button className={styles.button}>Try Captioni for Free</button>
    </section>
  );
}
