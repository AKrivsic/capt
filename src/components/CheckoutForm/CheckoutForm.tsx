'use client';

import { useState } from 'react';
import { useRewardful } from '../../hooks/useRewardful';
import styles from './CheckoutForm.module.css';

interface CheckoutFormProps {
  priceId: string;
  onCheckout: (referralId: string | null) => void;
}

export default function CheckoutForm({ priceId, onCheckout }: CheckoutFormProps) {
  const { referral, isReady } = useRewardful();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Track the checkout attempt
      if (typeof window !== 'undefined' && window.rewardful) {
        window.rewardful('track', 'checkout_started', {
          price_id: priceId,
          referral: referral
        });
      }

      // Call the parent component's checkout handler
      onCheckout(referral);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        <h3 className={styles.title}>Complete Your Purchase</h3>
        
        {/* Hidden referral input */}
        {referral && (
          <input 
            type="hidden" 
            name="referral" 
            value={referral} 
          />
        )}

        {/* Price display */}
        <div className={styles.priceDisplay}>
          <span className={styles.price}>$19</span>
          <span className={styles.period}>/month</span>
        </div>

        {/* Features list */}
        <ul className={styles.features}>
          <li>✓ Unlimited AI captions</li>
          <li>✓ All platforms (Instagram, TikTok, OnlyFans)</li>
          <li>✓ Priority support</li>
          <li>✓ Advanced customization</li>
        </ul>

        {/* Checkout button */}
        <button 
          type="submit" 
          className={styles.checkoutButton}
          disabled={isLoading || !isReady}
        >
          {isLoading ? 'Processing...' : 'Start Pro Plan'}
        </button>

        {/* Referral info */}
        {referral && (
          <div className={styles.referralInfo}>
            <span className={styles.referralBadge}>
              Referral Applied ✓
            </span>
          </div>
        )}

        {/* Loading state */}
        {!isReady && (
          <div className={styles.loadingState}>
            Loading affiliate tracking...
          </div>
        )}
      </div>
    </form>
  );
}
