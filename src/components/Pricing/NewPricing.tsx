/**
 * NewPricing - Nová pricing sekce podle specifikace
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plan } from '@prisma/client';
import { useBilling } from '@/hooks/useBilling';
import styles from './NewPricing.module.css';

type PlanType = 'free' | 'text-starter' | 'text-pro' | 'video-lite' | 'video-pro' | 'video-unlimited';

interface PricingPlan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  badge?: string;
  stripePlan?: Plan; // Stripe plan pro API volání
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'Perfect for trying out',
    features: [
      '✅ 3 text generations / day',
      '❌ No videos',
      '❌ No history'
    ],
    cta: 'Try free'
  },
  {
    id: 'text-starter',
    name: 'Text Starter',
    price: 9,
    period: '/month',
    description: 'Great for casual creators',
    features: [
      '✅ 100 text generations / month',
      '❌ No videos',
      '✅ Access to 6 styles'
    ],
    cta: 'Start for $9',
    stripePlan: Plan.TEXT_STARTER
  },
  {
    id: 'text-pro',
    name: 'Text Pro',
    price: 17,
    period: '/month',
    description: 'For serious content creators',
    features: [
      '✅ Unlimited texts',
      '✅ All styles',
      '✅ History + fast generation'
    ],
    cta: 'Upgrade to Pro →',
    popular: true,
    stripePlan: Plan.TEXT_PRO
  },
  {
    id: 'video-lite',
    name: 'Video Lite',
    price: 19,
    period: '/month',
    description: 'Entry for IG/TikTok creators',
    features: [
      '✅ 20 subtitle videos (≤60s)',
      '✅ + Text Starter (100 text generations)',
      '✅ All styles'
    ],
    cta: 'Try Video Lite 🎬',
    stripePlan: Plan.VIDEO_LITE
  },
  {
    id: 'video-pro',
    name: 'Video Pro',
    price: 39,
    period: '/month',
    description: 'Sweet spot for heavy creators',
    features: [
      '✅ 50 subtitle videos (≤60s)',
      '✅ + Text Pro (unlimited texts)',
      '✅ All styles + fast gen'
    ],
    cta: 'Go Video Pro →',
    stripePlan: Plan.VIDEO_PRO
  },
  {
    id: 'video-unlimited',
    name: 'Video Unlimited',
    price: 89,
    period: '/month',
    description: 'For agencies & OF managers',
    features: [
      '✅ Unlimited (fair use 500 videos/month)',
      '✅ + Text Pro (unlimited texts)',
      '✅ Custom styles (fonts/colors)',
      '✅ Priority support'
    ],
    cta: 'Go Unlimited 💎',
    badge: 'Save $10 → only $89',
    stripePlan: Plan.VIDEO_UNLIMITED
  }
];

const extraCredits = [
  { videos: 10, price: 7, icon: '🎬', sku: 'EXTRA_10_VIDEOS' as const },
  { videos: 25, price: 20, icon: '🎬', sku: 'EXTRA_25_VIDEOS' as const },
  { videos: 50, price: 40, icon: '🎬', sku: 'EXTRA_50_VIDEOS' as const }
];

export default function NewPricing() {
  const { status, data: session } = useSession();
  const [busy, setBusy] = useState<PlanType | null>(null);
  const [extraBusy, setExtraBusy] = useState<string | null>(null);
  const { loading, error, createSubscription, createPaymentIntent, redirectToCheckout, clearError } = useBilling();

  // Zkontroluj, jestli má uživatel video tarif
  const hasVideoPlan = () => {
    if (!session?.user?.plan) return false;
    const plan = session.user.plan as string;
    return plan === "VIDEO_LITE" || plan === "VIDEO_PRO" || plan === "VIDEO_UNLIMITED";
  };

  const handlePlanClick = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Free tarif vyžaduje přihlášení
      if (status !== 'authenticated') {
        window.location.href = `/api/auth/signin?callbackUrl=/#pricing`;
        return;
      }
      // Pokud je přihlášený, scroll na generátor
      document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setBusy(plan.id);
    clearError();
    
    try {
      if (status !== 'authenticated') {
        window.location.href = `/api/auth/signin?callbackUrl=/#pricing`;
        return;
      }

      if (!plan.stripePlan) {
        throw new Error('Plan is not available for purchase');
      }

      // Vytvoř subscription
      const result = await createSubscription(
        plan.stripePlan,
        `${window.location.origin}/dashboard?subscription=success`,
        `${window.location.origin}/#pricing?subscription=cancelled`
      );

      if (result?.url) {
        redirectToCheckout(result.url);
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setBusy(null);
    }
  };

  const handleExtraCredits = async (videos: number, price: number, sku: string) => {
    setExtraBusy(sku);
    clearError();
    
    try {
      if (status !== 'authenticated') {
        window.location.href = `/api/auth/signin?callbackUrl=/#pricing`;
        return;
      }

      // Vytvoř payment intent pro extra kredity
      const result = await createPaymentIntent(
        sku as 'EXTRA_10_VIDEOS' | 'EXTRA_25_VIDEOS' | 'EXTRA_50_VIDEOS',
        `${window.location.origin}/dashboard?payment=success`,
        `${window.location.origin}/#pricing?payment=cancelled`
      );

      if (result?.url) {
        redirectToCheckout(result.url);
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (error) {
      console.error('Extra credits error:', error);
      setExtraBusy(null);
    }
  };

  return (
    <section id="pricing" className={styles.pricing}>
      <div className={styles.container}>
        
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Choose your plan 💎</h2>
          <p className={styles.subtitle}>
            All plans include captions & subtitles. Pick what fits your vibe.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>❌ {error}</p>
            <button onClick={clearError} className={styles.errorClose}>
              ✕
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              id={plan.id}
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  Most Popular
                </div>
              )}
              
              {plan.badge && (
                <div className={styles.priceBadge}>
                  {plan.badge}
                </div>
              )}

              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.price}>${plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <div key={index} className={styles.feature}>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className={`${styles.planButton} ${plan.popular ? styles.popularButton : ''}`}
                onClick={() => handlePlanClick(plan)}
                disabled={busy === plan.id || loading}
              >
                {busy === plan.id ? (
                  <span className={styles.spinner}>⏳</span>
                ) : plan.id === 'free' && status !== 'authenticated' ? (
                  'Sign in to try'
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Extra Credits - vždy viditelné, ale koupit může jen video tarif */}
        <div className={styles.extraCredits}>
          <div className={styles.extraCreditsHeader}>
            <h3 className={styles.extraCreditsTitle}>Need more videos?</h3>
            <p className={styles.extraCreditsSubtitle}>
              Running out? Add video credits anytime.
            </p>
            <div className={styles.videoPlanNote}>
              <span className={styles.noteIcon}>ℹ️</span>
              <span className={styles.noteText}>Available for Video Lite, Video Pro, and Video Unlimited plans only</span>
            </div>
          </div>

          <div className={styles.extraCreditsGrid}>
            {extraCredits.map((credit, index) => (
              <div key={index} className={styles.creditCard}>
                <div className={styles.creditIcon}>{credit.icon}</div>
                <div className={styles.creditInfo}>
                  <div className={styles.creditVideos}>{credit.videos} extra</div>
                  <div className={styles.creditPrice}>${credit.price}</div>
                </div>
                <button
                  className={styles.creditButton}
                  onClick={() => {
                    if (status !== 'authenticated') {
                      window.location.href = '/api/auth/signin?callbackUrl=/#pricing';
                      return;
                    }
                    if (!hasVideoPlan()) {
                      // Scroll na video plány
                      document.getElementById('video-lite')?.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }
                    // Pokud má video tarif, může koupit
                    handleExtraCredits(credit.videos, credit.price, credit.sku);
                  }}
                  disabled={extraBusy === credit.sku || loading}
                >
                  {extraBusy === credit.sku ? (
                    <span className={styles.spinner}>⏳</span>
                  ) : status !== 'authenticated' ? (
                    'Sign in to buy'
                  ) : !hasVideoPlan() ? (
                    'Upgrade to buy'
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Cancel anytime. Instant access.
          </p>
        </div>
      </div>
    </section>
  );
}
