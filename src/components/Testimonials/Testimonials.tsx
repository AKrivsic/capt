import styles from './Testimonials.module.css';
import Image from 'next/image';

export default function Testimonials() {
  return (
    <section className={styles.testimonial}>
      <Image
  src="https://i.pravatar.cc/100?img=47"
  alt="User"
  width={60}
  height={60}
  className={styles.avatar}
/>
      <p className={styles.quote}>
        <strong>This tool changed my social media</strong>
      </p>
    </section>
  );
}
