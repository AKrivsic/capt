/**
 * CreditsBar - Zobrazení stavu kreditů + nákup balíčků
 * Modal s Stripe Payment Request Button
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './CreditsBar.module.css';
import { CREDIT_PACKS } from '@/types/subtitles';
import { purchaseTracking } from '@/lib/tracking';
import type { SkuCode } from '@/types/subtitles';

interface Props {
  credits: number;
  onCreditsUpdate: (newCredits: number) => void;
}

export default function CreditsBar({ credits, onCreditsUpdate }: Props) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditsBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        onCreditsUpdate(data.credits);
        
        purchaseTracking.creditsBalance(data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }, [onCreditsUpdate]);

  // Fetch aktuální stav kreditů při mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchCreditsBalance();
    }
  }, [session, fetchCreditsBalance]);

  const handleBuyCredits = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setError(null);
  }, []);

  const handlePurchase = useCallback(async (sku: SkuCode) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Vytvoř Payment Intent
      const intentResponse = await fetch('/api/billing/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku })
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { } = await intentResponse.json();

      // 2. Process actual Stripe payment
      console.log('Processing payment for SKU:', sku);
      
      // TODO: Implement actual Stripe payment processing
      throw new Error('Payment processing not implemented - requires Stripe integration');

      // 3. Payment completion
      const pack = CREDIT_PACKS[sku];
      const newCredits = credits + pack.credits;
      onCreditsUpdate(newCredits);

      purchaseTracking.started({
        sku,
        amount: pack.priceCents, // už v centech
        credits: pack.credits
      });

      setShowModal(false);
      
      // TODO: Zobrazit success toast
      
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error instanceof Error ? error.message : 'Purchase error');
    } finally {
      setIsLoading(false);
    }
  }, [credits, onCreditsUpdate]);

  const getCreditsColor = useCallback(() => {
    if (credits <= 0) return styles.creditsZero;
    if (credits <= 2) return styles.creditsLow;
    return styles.creditsOk;
  }, [credits]);

  return (
    <>
      {/* Credits display */}
      <div className={styles.creditsBar}>
        <div className={styles.creditsInfo}>
          <span className={styles.creditsIcon}>⚡</span>
          <span className={`${styles.creditsCount} ${getCreditsColor()}`}>
            {credits}
          </span>
          <span className={styles.creditsLabel}>credits</span>
        </div>
        
        <button 
          className={styles.buyButton}
          onClick={handleBuyCredits}
          disabled={isLoading}
        >
          <span className={styles.buyIcon}>💳</span>
          Buy
        </button>
      </div>

      {/* Purchase modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Buy Credits</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Each credit = 1 video with AI subtitles (up to 60 seconds)
              </p>

              {error && (
                <div className={styles.error}>
                  <span className={styles.errorIcon}>⚠️</span>
                  {error}
                </div>
              )}

              <div className={styles.packages}>
                {Object.values(CREDIT_PACKS).map((pack) => (
                  <div 
                    key={pack.sku}
                    className={`${styles.package} ${pack.popular ? styles.popular : ''}`}
                  >
                    {pack.popular && (
                      <div className={styles.popularBadge}>
                        Most Popular
                      </div>
                    )}
                    
                    <div className={styles.packageHeader}>
                      <h3 className={styles.packageName}>{pack.name}</h3>
                      <div className={styles.packagePrice}>
                        ${(pack.priceCents / 100).toFixed(2)}
                      </div>
                    </div>

                    <div className={styles.packageDetails}>
                      <div className={styles.packageCredits}>
                        {pack.credits} credits
                      </div>
                      <div className={styles.packageValue}>
                        ${(pack.priceCents / 100 / pack.credits).toFixed(2)} per credit
                      </div>
                    </div>

                    <button
                      className={styles.packageButton}
                      onClick={() => handlePurchase(pack.sku)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className={styles.spinner} />
                      ) : (
                        <>
                          <span className={styles.packageButtonIcon}>💳</span>
                          Buy for ${(pack.priceCents / 100).toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.paymentInfo}>
                <p className={styles.paymentNote}>
                  💳 Apple Pay • Google Pay • Kreditní karta
                </p>
                <p className={styles.securityNote}>
                  🔒 Secured by Stripe • No card storage
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
