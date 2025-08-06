import styles from './Testimonials.module.css';

export default function Testimonials() {
  return (
    <section className={styles.testimonial}>
      <img
        src="https://i.pravatar.cc/100?img=47"
        alt="User"
        className={styles.avatar}
      />
      <p className={styles.quote}>
        <strong>This tool changed my social media</strong>
      </p>
    </section>
  );
}
