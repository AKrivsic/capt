// src/components/Pricing/Pricing.tsx
"use client";
import styles from "./Pricing.module.css";
import { trackSignupStart, trackCheckoutStart } from "@/utils/tracking";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function Pricing() {
  const [busy, setBusy] = useState<null | "STARTER" | "PRO" | "PREMIUM">(null);
  const { status } = useSession();

  async function startCheckout(plan: "STARTER" | "PRO" | "PREMIUM") {
    try {
      setBusy(plan);
      trackCheckoutStart(plan);
      if (status !== "authenticated") {
        window.location.href = "/api/auth/signin?callbackUrl=/#pricing";
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/api/auth/signin?callbackUrl=/#pricing";
        return;
      }
      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }
      alert("Checkout failed.");
    } catch {
      alert("Checkout error.");
    } finally {
      setBusy(null);
    }
  }
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
          <button
            className={styles.btn}
            onClick={() => trackSignupStart("pricing")}
            aria-label="Start free plan"
            data-testid="btn-pricing-free"
            onMouseDown={(e) => e.preventDefault()}
            onClickCapture={() => { window.location.href = "/api/auth/signin?callbackUrl=/"; }}
          >
            Start Free
          </button>
        </div>

        <div className={`${styles.plan} ${styles.starterPlan}`}>
          <h3>Starter</h3>
          <p className={styles.price}>$9 / 3 days</p>
          <ul>
            <li>✅ 15 generations total</li>
            <li>✅ Premium styles</li>
            <li>🚫 No saving</li>
          </ul>
          <button
            className={styles.btn}
            onClick={() => startCheckout("STARTER")}
            aria-label="Unlock Starter plan"
            data-testid="btn-pricing-starter"
            disabled={busy !== null}
          >
            {busy === "STARTER" ? "Loading..." : "Unlock Access"}
          </button>
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
          <button
            className={styles.btn}
            onClick={() => startCheckout("PRO")}
            aria-label="Go Pro plan"
            data-testid="btn-pricing-pro"
            disabled={busy !== null}
          >
            {busy === "PRO" ? "Loading..." : "Go Pro"}
          </button>
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
          <button
            className={styles.btn}
            onClick={() => startCheckout("PREMIUM")}
            aria-label="Get Premium plan"
            data-testid="btn-pricing-premium"
            disabled={busy !== null}
          >
            {busy === "PREMIUM" ? "Loading..." : "Get Premium"}
          </button>
        </div>

      </div>
    </section>
  );
}
