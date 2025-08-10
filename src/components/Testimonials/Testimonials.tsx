import styles from './Testimonials.module.css';
import Image from 'next/image';

const testimonials = [
  {
    avatar: 'https://i.pravatar.cc/100?img=47',
    quote: 'This tool gave me instant confidence in my posts.',
  },
  {
    avatar: 'https://i.pravatar.cc/100?img=21',
    quote: 'Feels like having a social media assistant 💅',
  },
  {
    avatar: 'https://i.pravatar.cc/100?img=41',
    quote: 'My captions are now 🔥 and I barely lift a finger.',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.testimonial}>
      {testimonials.map((item, idx) => (
        <div
          key={idx}
          className={`${styles.card} ${styles.fadeUp} ${styles[`delay${idx + 1}`]}`}
        >
          <Image
            src={item.avatar}
            alt=""
            width={64}
            height={64}
            className={styles.avatar}
          />
          <p className={styles.quote}>
            <strong>“{item.quote}”</strong>
          </p>
        </div>
      ))}
    </section>
  );
}

