import styles from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={styles.cta} id="final-cta">
      <h2 className={styles.heading}>Ready to boost your content?</h2>
      <p className={styles.subheading}>Start generating AI-powered captions, bios & more – totally free.</p>
      <a href="#demo" className={styles.button}>
        Try Captioni for Free
      </a>
    </section>
  );
}
