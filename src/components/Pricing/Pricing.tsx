import styles from './Pricing.module.css';

export default function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <h2 className={styles.heading}>Choose your plan</h2>
      <div className={styles.plans}>
        <div className={styles.plan}>
          <h3>Free</h3>
          <p className={styles.price}>0 €</p>
          <ul>
            <li>✅ 5 generations/day</li>
            <li>🚫 No saving</li>
            <li>🚫 No customization</li>
          </ul>
          <button className={styles.btn}>Start Free</button>
        </div>

        <div className={`${styles.plan} ${styles.recommended}`}>
          <h3>Creator</h3>
          <p className={styles.price}>9 €/month</p>
          <ul>
            <li>✅ 100 generations/day</li>
            <li>✅ Save captions</li>
            <li>✅ Style memory</li>
          </ul>
          <button className={styles.btn}>Choose Plan</button>
        </div>

        <div className={styles.plan}>
          <h3>Pro</h3>
          <p className={styles.price}>19 €/month</p>
          <ul>
            <li>✅ Unlimited generations</li>
            <li>✅ Save & organize</li>
            <li>✅ Early access to features</li>
          </ul>
          <button className={styles.btn}>Choose Plan</button>
        </div>
      </div>
    </section>
  );
}
