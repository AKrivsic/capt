import { Plan } from '@prisma/client';

export interface PlanLimits {
  text: number;           // -1 = unlimited
  video: number;          // -1 = unlimited
  maxVideoDuration: number; // max délka videa v sekundách
  maxVideosPerMonth: number; // max počet videí za měsíc
}

export interface PlanInfo {
  name: string;
  price: number;
  description: string;
  features: string[];
  ctaText: string;
  stripePriceId?: string; // Stripe Price ID pro subscription
}

export interface ExtraCreditsInfo {
  sku: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  stripePriceId?: string; // Stripe Price ID pro jednorázovou platbu
}

// Plánové limity podle typu plánu
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { text: 3, video: 0, maxVideoDuration: 0, maxVideosPerMonth: 0 },
  TEXT_STARTER: { text: 100, video: 0, maxVideoDuration: 0, maxVideosPerMonth: 0 },
  TEXT_PRO: { text: -1, video: 0, maxVideoDuration: 0, maxVideosPerMonth: 0 }, // unlimited
  VIDEO_LITE: { text: 100, video: 20, maxVideoDuration: 60, maxVideosPerMonth: 20 },
  VIDEO_PRO: { text: -1, video: 50, maxVideoDuration: 60, maxVideosPerMonth: 50 },
  VIDEO_UNLIMITED: { text: -1, video: -1, maxVideoDuration: 120, maxVideosPerMonth: 500 }, // fair use
};

// Informace o plánech pro UI
export const PLAN_INFO: Record<Plan, PlanInfo> = {
  FREE: {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Captioni',
    features: [
      '✅ 3 text generations / day',
      '❌ No videos',
      '❌ No history'
    ],
    ctaText: 'Try free'
  },
  TEXT_STARTER: {
    name: 'Text Starter',
    price: 9,
    description: 'Great for content creators',
    features: [
      '✅ 100 text generations / month',
      '❌ No videos',
      '✅ Access to 6 styles'
    ],
    ctaText: 'Start for $9'
  },
  TEXT_PRO: {
    name: 'Text Pro',
    price: 17,
    description: 'Unlimited text generation',
    features: [
      '✅ Unlimited texts',
      '✅ All styles',
      '✅ History + fast generation'
    ],
    ctaText: 'Upgrade to Pro →'
  },
  VIDEO_LITE: {
    name: 'Video Lite',
    price: 19,
    description: 'Perfect for IG/TikTok creators',
    features: [
      '✅ 20 subtitle videos (≤60s)',
      '✅ + Text Starter (100 text generations)',
      '✅ All styles'
    ],
    ctaText: 'Try Video Lite 🎬'
  },
  VIDEO_PRO: {
    name: 'Video Pro',
    price: 39,
    description: 'Sweet spot for heavy creators',
    features: [
      '✅ 50 subtitle videos (≤60s)',
      '✅ + Text Pro (unlimited texts)',
      '✅ All styles + fast gen'
    ],
    ctaText: 'Go Video Pro →'
  },
  VIDEO_UNLIMITED: {
    name: 'Video Unlimited',
    price: 89,
    description: 'For agencies and power users',
    features: [
      '✅ Unlimited (fair use 500 videos/month)',
      '✅ + Text Pro (unlimited texts)',
      '✅ Custom styles (fonts/colors)',
      '✅ Priority support'
    ],
    ctaText: 'Go Unlimited 💎'
  }
};

// Extra kredity pro jednorázové nákupy
export const EXTRA_CREDITS: ExtraCreditsInfo[] = [
  {
    sku: 'EXTRA_10_VIDEOS',
    name: '10 Extra Videos',
    credits: 10,
    price: 7,
    description: 'Perfect for occasional video creators',
    stripePriceId: undefined // TODO: Nastavit po vytvoření v Stripe
  },
  {
    sku: 'EXTRA_25_VIDEOS',
    name: '25 Extra Videos',
    credits: 25,
    price: 20,
    description: 'Great value for regular creators',
    stripePriceId: undefined // TODO: Nastavit po vytvoření v Stripe
  },
  {
    sku: 'EXTRA_50_VIDEOS',
    name: '50 Extra Videos',
    credits: 50,
    price: 40,
    description: 'Best value for heavy video creators',
    stripePriceId: undefined // TODO: Nastavit po vytvoření v Stripe
  }
];

// Stripe Price IDs pro subscription plány (nastavit po vytvoření v Stripe)
export const STRIPE_SUBSCRIPTION_PRICE_IDS: Record<Plan, string | undefined> = {
  FREE: undefined,
  TEXT_STARTER: undefined, // TODO: Nastavit price_xxx
  TEXT_PRO: undefined,     // TODO: Nastavit price_xxx
  VIDEO_LITE: undefined,   // TODO: Nastavit price_xxx
  VIDEO_PRO: undefined,    // TODO: Nastavit price_xxx
  VIDEO_UNLIMITED: undefined // TODO: Nastavit price_xxx
};

// Stripe Price IDs pro jednorázové platby
export const STRIPE_ONE_TIME_PRICE_IDS: Record<string, string | undefined> = {
  EXTRA_10_VIDEOS: undefined,  // TODO: Nastavit price_xxx
  EXTRA_25_VIDEOS: undefined,  // TODO: Nastavit price_xxx
  EXTRA_50_VIDEOS: undefined   // TODO: Nastavit price_xxx
};

// Helper funkce
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function getPlanInfo(plan: Plan): PlanInfo {
  return PLAN_INFO[plan];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export function formatLimit(limit: number): string {
  if (isUnlimited(limit)) {
    return 'Unlimited';
  }
  return limit.toString();
}
