import styles from './Pricing.module.css';

export default function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <h2 className={styles.heading}>Choose your plan</h2>
      <div className={styles.plans}>
        
        <div className={`${styles.plan} ${styles.freePlan}`}>
          <h3>Free</h3>
          <p className={styles.price}>$0</p>
          <ul>
            <li>✅ 3 generations / day</li>
            <li>🚫 No history saving</li>
            <li>🚫 No style memory</li>
          </ul>
          <button className={styles.btn}>Start Free</button>
        </div>

        <div className={`${styles.plan} ${styles.starterPlan}`}>
          <h3>Starter</h3>
          <p className={styles.price}>$9 / 3 days</p>
          <ul>
            <li>✅ 15 generations total</li>
            <li>✅ Premium styles</li>
            <li>🚫 No saving</li>
          </ul>
          <button className={styles.btn}>Unlock Access</button>
        </div>

        <div className={`${styles.plan} ${styles.proPlan}`}>
          <div className={styles.badge}>🔥 Most popular</div>
          <h3>Pro</h3>
          <p className={styles.price}>$29 / month</p>
          <ul>
            <li>✅ Unlimited generations</li>
            <li>✅ Save & organize outputs</li>
            <li>✅ Style & vibe memory</li>
            <li>✅ Priority support</li>
          </ul>
          <button className={styles.btn}>Go Pro</button>
        </div>

        <div className={`${styles.plan} ${styles.premiumPlan}`}>
          <div className={styles.badgeBestValue}>💎 Best value</div>
          <h3>Premium</h3>
          <p className={styles.price}>$79 / 3 months</p>
          <ul>
            <li>✅ Everything in Pro</li>
            <li>💸 Save $8 compared to monthly</li>
            <li>🚀 Best for regular creators</li>
          </ul>
          <button className={styles.btn}>Get Premium</button>
        </div>

      </div>
    </section>
  );
}
