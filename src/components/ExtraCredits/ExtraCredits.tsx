// src/components/ExtraCredits/ExtraCredits.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import styles from "./ExtraCredits.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CREDIT_PACKAGES = [
  {
    sku: "EXTRA_10_VIDEOS",
    credits: 10,
    price: 7,
    popular: false,
    description: "Perfect for occasional creators"
  },
  {
    sku: "EXTRA_25_VIDEOS", 
    credits: 25,
    price: 20,
    popular: true,
    description: "Most popular choice"
  },
  {
    sku: "EXTRA_50_VIDEOS",
    credits: 50,
    price: 35,
    popular: false,
    description: "Best value for power users"
  }
];

export default function ExtraCredits() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  // Zkontroluj, jestli má uživatel video tarif
  const hasVideoPlan = () => {
    if (!session?.user?.plan) return false;
    const plan = session.user.plan as string;
    return plan === "VIDEO_LITE" || plan === "VIDEO_PRO" || plan === "VIDEO_UNLIMITED";
  };

  const handlePurchase = async (sku: string) => {
    if (status !== "authenticated") {
      window.location.href = "/api/auth/signin?callbackUrl=/dashboard/billing";
      return;
    }

    if (!hasVideoPlan()) {
      window.location.href = "/#pricing";
      return;
    }

    try {
      setLoading(sku);
      
      const response = await fetch("/api/billing/purchase-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }

      const { error } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/billing?success=true`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error("Purchase error:", error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(null);
    }
  };

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Vždy zobraz extra kredity, ale s různými tlačítky podle stavu uživatele

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Buy Extra Video Credits</h2>
        <p>Need more video generations? Purchase additional credits that never expire.</p>
        <div className={styles.videoPlanNote}>
          <span className={styles.noteIcon}>ℹ️</span>
          <span className={styles.noteText}>Available for Video Lite, Video Pro, and Video Unlimited plans only</span>
        </div>
      </div>

      <div className={styles.packages}>
        {CREDIT_PACKAGES.map((pkg) => (
          <div 
            key={pkg.sku} 
            className={`${styles.package} ${pkg.popular ? styles.popular : ""}`}
          >
            {pkg.popular && <div className={styles.badge}>Most Popular</div>}
            
            <div className={styles.packageHeader}>
              <h3>{pkg.credits} Credits</h3>
              <div className={styles.price}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{pkg.price}</span>
              </div>
            </div>
            
            <p className={styles.description}>{pkg.description}</p>
            
            <button
              className={styles.buyButton}
              onClick={() => handlePurchase(pkg.sku)}
              disabled={loading === pkg.sku}
            >
              {loading === pkg.sku ? "Processing..." : 
               status !== "authenticated" ? "Sign in to buy" :
               !hasVideoPlan() ? "Upgrade to buy" :
               `Buy ${pkg.credits} Credits`}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p>• Credits never expire</p>
        <p>• Works with any plan</p>
        <p>• Secure payment via Stripe</p>
      </div>

    </div>
  );
}
