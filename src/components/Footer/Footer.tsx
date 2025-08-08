import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        © 2025 <span className={styles.brand}>Captioni</span> ·{" "}
        <a href="#" className={styles.link}>About</a> ·{" "}
        <a href="#faq" className={styles.link}>FAQ</a> ·{" "}
        <a href="mailto:hello@captioni.ai" className={styles.link}>Contact</a> ·{" "}
        <a href="#" className={styles.link}>Terms</a> ·{" "}
        <a href="#" className={styles.link}>Privacy</a>
      </p>
    </footer>
  );
}

