import { Plan, PrismaClient } from '@prisma/client';
import { PLAN_LIMITS, isUnlimited } from '@/constants/plans';

export interface UserLimits {
  textGenerationsLeft: number;
  textGenerationsUsed: number;
  videoCredits: number;
  plan: Plan;
  videosUsedThisMonth: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limitReached?: boolean; // pro UX flow - poslední video se zobrazí, ale při dalším pokusu modal
}

/**
 * Zkontroluje, zda má uživatel dostatek text generací
 */
export function checkTextGenerationLimit(
  userLimits: UserLimits
): LimitCheckResult {
  const { textGenerationsLeft } = userLimits;
  
  // Unlimited plány
  if (isUnlimited(textGenerationsLeft)) {
    return { allowed: true, remaining: -1 };
  }
  
  // Kontrola limitu
  if (textGenerationsLeft <= 0) {
    return {
      allowed: false,
      reason: 'You have reached the text generation limit for this month',
      remaining: 0
    };
  }
  
  return {
    allowed: true,
    remaining: textGenerationsLeft
  };
}

/**
 * Zkontroluje, zda má uživatel dostatek video kreditů
 */
export function checkVideoCreditsLimit(
  userLimits: UserLimits
): LimitCheckResult {
  const { videoCredits } = userLimits;
  
  // Unlimited plány
  if (isUnlimited(videoCredits)) {
    return { allowed: true, remaining: -1 };
  }
  
  // Kontrola kreditů
  if (videoCredits <= 0) {
    return {
      allowed: false,
      reason: 'Insufficient video credits',
      remaining: 0
    };
  }
  
  return {
    allowed: true,
    remaining: videoCredits
  };
}

/**
 * Zkontroluje, zda má uživatel dostatek video generací pro tento měsíc
 */
export function checkVideoGenerationLimit(
  userLimits: UserLimits
): LimitCheckResult {
  const { plan, videosUsedThisMonth } = userLimits;
  const planLimits = PLAN_LIMITS[plan];
  
  // Demo uživatelé (bez registrace) - 1 video/session
  if (!userLimits) {
    return {
      allowed: false,
      reason: 'You must register to generate videos',
      remaining: 0
    };
  }
  
  // Unlimited plány
  if (isUnlimited(planLimits.maxVideosPerMonth)) {
    return { allowed: true, remaining: -1 };
  }
  
  // Kontrola měsíčního limitu
  if (videosUsedThisMonth >= planLimits.maxVideosPerMonth) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${planLimits.maxVideosPerMonth} videos per month`,
      remaining: 0,
      limitReached: true
    };
  }
  
  return {
    allowed: true,
    remaining: planLimits.maxVideosPerMonth - videosUsedThisMonth
  };
}

/**
 * Zkontroluje, zda je délka videa v povoleném limitu
 */
export function checkVideoDurationLimit(
  durationSec: number,
  plan: Plan
): LimitCheckResult {
  const planLimits = PLAN_LIMITS[plan];
  
  if (planLimits.maxVideoDuration === 0) {
    return {
      allowed: false,
      reason: 'Your plan does not allow video generation',
      remaining: 0
    };
  }
  
  if (durationSec > planLimits.maxVideoDuration) {
    return {
      allowed: false,
      reason: `Video is too long. Maximum for your plan is ${planLimits.maxVideoDuration}s`,
      remaining: planLimits.maxVideoDuration
    };
  }
  
  return {
    allowed: true,
    remaining: planLimits.maxVideoDuration
  };
}

/**
 * Odečte text generaci z limitu uživatele
 */
export async function consumeTextGeneration(
  userId: string,
  prisma: PrismaClient
): Promise<{ success: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        textGenerationsLeft: true,
        textGenerationsUsed: true,
        plan: true
      }
    });

    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    // Kontrola limitu
    const limitCheck = checkTextGenerationLimit({
      textGenerationsLeft: user.textGenerationsLeft,
      textGenerationsUsed: user.textGenerationsUsed,
      videoCredits: 0, // Není potřeba pro text
      plan: user.plan,
      videosUsedThisMonth: 0 // Není potřeba pro text
    });

    if (!limitCheck.allowed) {
      return { success: false, reason: limitCheck.reason };
    }

    // Odečti generaci (pokud není unlimited)
    if (!isUnlimited(user.textGenerationsLeft)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          textGenerationsLeft: { decrement: 1 },
          textGenerationsUsed: { increment: 1 }
        }
      });
    }

    return { success: true };

  } catch (error) {
    console.error('Error consuming text generation:', error);
    return { success: false, reason: 'Error consuming generation' };
  }
}

/**
 * Odečte video kredit z limitu uživatele
 */
export async function consumeVideoCredit(
  userId: string,
  prisma: PrismaClient
): Promise<{ success: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        videoCredits: true,
        plan: true
      }
    });

    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    // Kontrola limitu
    const limitCheck = checkVideoCreditsLimit({
      textGenerationsLeft: 0, // Není potřeba pro video
      textGenerationsUsed: 0,
      videoCredits: user.videoCredits,
      plan: user.plan,
      videosUsedThisMonth: 0 // Není potřeba pro kredity
    });

    if (!limitCheck.allowed) {
      return { success: false, reason: limitCheck.reason };
    }

    // Odečti kredit (pokud není unlimited)
    if (!isUnlimited(user.videoCredits)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          videoCredits: { decrement: 1 }
        }
      });
    }

    return { success: true };

  } catch (error) {
    console.error('Error consuming video credit:', error);
    return { success: false, reason: 'Error consuming credit' };
  }
}

/**
 * Získá aktuální limity uživatele
 */
export async function getUserLimits(
  userId: string,
  prisma: PrismaClient
): Promise<UserLimits | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        textGenerationsLeft: true,
        textGenerationsUsed: true,
        videoCredits: true,
        plan: true
      }
    });

    if (!user) {
      return null;
    }

    // Spočítej videa použité tento měsíc
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const videosUsedThisMonth = await prisma.videoUsage.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    return {
      textGenerationsLeft: user.textGenerationsLeft,
      textGenerationsUsed: user.textGenerationsUsed,
      videoCredits: user.videoCredits,
      plan: user.plan,
      videosUsedThisMonth
    };

  } catch (error) {
    console.error('Error getting user limits:', error);
    return null;
  }
}

/**
 * Zaznamená použití videa do databáze
 */
export async function recordVideoUsage(
  userId: string | null,
  ip: string | null,
  durationSec: number,
  prisma: PrismaClient
): Promise<{ success: boolean; reason?: string }> {
  try {
    await prisma.videoUsage.create({
      data: {
        userId: userId,
        ip: ip,
        duration: durationSec
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Error recording video usage:', error);
    return { success: false, reason: 'Error recording video usage' };
  }
}

/**
 * Zkontroluje demo limity pro IP adresu
 */
export async function checkDemoVideoLimit(
  ip: string,
  prisma: PrismaClient
): Promise<LimitCheckResult> {
  try {
    // Demo limit: 1 video/session (24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const demoUsage = await prisma.videoUsage.count({
      where: {
        ip: ip,
        userId: null, // demo uživatelé
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    if (demoUsage >= 1) {
      return {
        allowed: false,
        reason: 'Demo limit: 1 video per 24 hours. Register for more videos.',
        remaining: 0,
        limitReached: true
      };
    }

    return {
      allowed: true,
      remaining: 1 - demoUsage
    };

  } catch (error) {
    console.error('Error checking demo video limit:', error);
    return {
      allowed: false,
      reason: 'Error checking demo limit',
      remaining: 0
    };
  }
}

/**
 * Zkontroluje, zda má uživatel přístup k určitému stylu
 */
export function hasStyleAccess(plan: Plan): boolean {
  // Všechny plány kromě FREE mají přístup ke všem stylům
  return plan !== Plan.FREE;
}

/**
 * Zkontroluje, zda má uživatel přístup k historii
 */
export function hasHistoryAccess(plan: Plan): boolean {
  // TEXT_PRO a vyšší mají přístup k historii
  return plan === Plan.TEXT_PRO || 
         plan === Plan.VIDEO_LITE || 
         plan === Plan.VIDEO_PRO || 
         plan === Plan.VIDEO_UNLIMITED;
}

/**
 * Zkontroluje, zda má uživatel rychlé generování
 */
export function hasFastGeneration(plan: Plan): boolean {
  // TEXT_PRO a vyšší mají rychlé generování
  return plan === Plan.TEXT_PRO || 
         plan === Plan.VIDEO_PRO || 
         plan === Plan.VIDEO_UNLIMITED;
}