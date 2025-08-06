import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        © 2025 Captioni •{" "}
        <a href="#" className={styles.link}>About</a> •{" "}
        <a href="#" className={styles.link}>FAQ</a> •{" "}
        <a href="#" className={styles.link}>Contact</a> •{" "}
        <a href="#" className={styles.link}>Terms</a> •{" "}
        <a href="#" className={styles.link}>Privacy</a>
      </p>
    </footer>
  );
}
