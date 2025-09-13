"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plan } from '@prisma/client';
import { useBilling } from '@/hooks/useBilling';
// import { styleMeta } from '@/constants/styleMeta';
import styles from './HomepagePricing.module.css';

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
  stripePlan?: Plan;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'All plans include captions & subtitles. Pick what fits your vibe.',
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
    stripePlan: 'TEXT_STARTER'
  },
  {
    id: 'text-pro',
    name: 'Text Pro',
    price: 17,
    period: '/month',
    description: 'Spotify-tier, serious vibes',
    features: [
      '✅ Unlimited texts',
      '✅ All styles',
      '✅ History + fast generation'
    ],
    cta: 'Upgrade to Pro →',
    popular: false,
    stripePlan: 'TEXT_PRO'
  },
  {
    id: 'video-lite',
    name: 'Video Lite',
    price: 19,
    period: '/month',
    description: 'Entry for IG/TikTok girls',
    features: [
      '✅ 20 subtitle videos (≤60s)',
      '✅ + Text Starter (100 text generations)',
      '✅ All styles'
    ],
    cta: 'Try Video Lite 🎬',
    popular: true,
    stripePlan: 'VIDEO_LITE'
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
    stripePlan: 'VIDEO_PRO'
  },
  {
    id: 'video-unlimited',
    name: 'Video Unlimited',
    price: 89,
    period: '/month',
    description: 'Agencies & managers (anchor $99)',
    features: [
      '✅ Unlimited (fair use 500 videos/month)',
      '✅ + Text Pro (unlimited texts)',
      '✅ Custom styles (fonts/colors)',
      '✅ Priority support'
    ],
    cta: 'Go Unlimited 💎',
    stripePlan: 'VIDEO_UNLIMITED'
  }
];

export default function HomepagePricing() {
  const { data: session } = useSession();
  const { startCheckout, loading } = useBilling();
  const [selectedStyle, setSelectedStyle] = useState('Barbie');
  const [platformColor, setPlatformColor] = useState<string | null>(null);
  const [extraCreditsBusy, setExtraCreditsBusy] = useState<string | null>(null);
  
  // Use variables to avoid unused variable warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { selectedStyle, platformColor };

  // Sleduj změny stylu (custom event + localStorage)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedPrefs = localStorage.getItem('captioni_pref_v1');
      if (savedPrefs) {
        try {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.style) {
            setSelectedStyle(prefs.style);
          }
          if (prefs.platformColor) {
            setPlatformColor(prefs.platformColor);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    };

    // Zkontroluj při mount
    handleStorageChange();

    // Sleduj změny v localStorage (jiná tab)
    window.addEventListener('storage', handleStorageChange);
    // Sleduj okamžité změny v rámci stejného okna
    const handleCustom = (e: Event) => {
      const ev = e as CustomEvent<{ style?: string; platformColor?: string }>;
      if (ev.detail?.style) setSelectedStyle(ev.detail.style);
      if (ev.detail?.platformColor) setPlatformColor(ev.detail.platformColor);
    };
    window.addEventListener('captioni:style-changed', handleCustom as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('captioni:style-changed', handleCustom as EventListener);
    };
  }, []);

  // Získej barvu pro vybraný styl
  // const getStyleColor = () => {
  //   return platformColor || styleMeta[selectedStyle]?.color || '#8b5cf6';
  // };

  // Získej background pro tarif podle indexu
  const getPlanBackground = (index: number) => {
    const backgrounds = [
      '#fadadd', // barbie
      '#d1d1e0', // edgy  
      '#ead9ff', // glamour
      '#c5f5d1', // fun
      '#f5f5dc', // aesthetic
      '#e0e0e0'  // minimalist
    ];
    return backgrounds[index % backgrounds.length];
  };

  const hasVideoPlan = () => {
    if (!session?.user?.plan) return false;
    const videoPlans = ['VIDEO_LITE', 'VIDEO_PRO', 'VIDEO_UNLIMITED'];
    return videoPlans.includes(session.user.plan);
  };

  const handlePlanClick = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Redirect to sign in for free plan
      window.location.href = '/api/auth/signin';
      return;
    }

    if (!session?.user) {
      // Redirect to sign in first
      window.location.href = '/api/auth/signin';
      return;
    }

    if (plan.stripePlan) {
      await startCheckout(plan.stripePlan);
    }
  };

  const handleExtraCreditsPurchase = async (sku: string) => {
    if (!hasVideoPlan()) {
      alert('Extra video credits are only available for video plans (Video Lite, Video Pro, Video Unlimited). Please upgrade to a video plan first.');
      return;
    }

    if (!session?.user) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setExtraCreditsBusy(sku);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
      });
      
      const data = await response.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Extra credits purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setExtraCreditsBusy(null);
    }
  };

  return (
    <section 
      id="pricing" 
      className={styles.section}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose your plan 💎</h2>
          <p className={styles.subtitle}>
            All plans include captions & subtitles. Pick what fits your vibe.
          </p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
              style={{
                backgroundColor: getPlanBackground(index)
              }}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
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
                disabled={loading}
              >
                {loading ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Extra Credits block */}
      <div className={styles.extraCredits}>
        <h3 className={styles.extraTitle}>Need more videos?</h3>
        <p className={styles.extraSub}>Running out? Add video credits anytime.</p>
        {!hasVideoPlan() && (
          <p className={styles.extraWarning}>
            ⚠️ Extra video credits are only available for video plans (Video Lite, Video Pro, Video Unlimited)
          </p>
        )}
        <div className={styles.extraGrid}>
          <div
            className={`${styles.extraCard} ${!hasVideoPlan() ? styles.disabled : ''}`}
            onClick={() => hasVideoPlan() && handleExtraCreditsPurchase('EXTRA_10_VIDEOS')}
            style={{ cursor: hasVideoPlan() ? 'pointer' : 'not-allowed' }}
          >
            <div className={styles.extraName}>🎬 10 extra</div>
            <div className={styles.extraPrice}>$7</div>
            {extraCreditsBusy === 'EXTRA_10_VIDEOS' && (
              <div className={styles.loading}>Processing...</div>
            )}
          </div>
          <div
            className={`${styles.extraCard} ${!hasVideoPlan() ? styles.disabled : ''}`}
            onClick={() => hasVideoPlan() && handleExtraCreditsPurchase('EXTRA_25_VIDEOS')}
            style={{ cursor: hasVideoPlan() ? 'pointer' : 'not-allowed' }}
          >
            <div className={styles.extraName}>🎬 25 extra</div>
            <div className={styles.extraPrice}>$20</div>
            {extraCreditsBusy === 'EXTRA_25_VIDEOS' && (
              <div className={styles.loading}>Processing...</div>
            )}
          </div>
          <div
            className={`${styles.extraCard} ${!hasVideoPlan() ? styles.disabled : ''}`}
            onClick={() => hasVideoPlan() && handleExtraCreditsPurchase('EXTRA_50_VIDEOS')}
            style={{ cursor: hasVideoPlan() ? 'pointer' : 'not-allowed' }}
          >
            <div className={styles.extraName}>🎬 50 extra</div>
            <div className={styles.extraPrice}>$40</div>
            {extraCreditsBusy === 'EXTRA_50_VIDEOS' && (
              <div className={styles.loading}>Processing...</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
