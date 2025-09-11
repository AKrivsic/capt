import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plan } from '@prisma/client';

export interface VideoLimits {
  maxDuration: number;
  maxVideosPerMonth: number;
  videosUsedThisMonth: number;
  remaining: number;
  plan: Plan;
}

export interface VideoLimitCheck {
  allowed: boolean;
  reason?: string;
  limitReached?: boolean;
}

export function useVideoLimits() {
  const { data: session } = useSession();
  const [limits, setLimits] = useState<VideoLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLimits();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchLimits = async () => {
    try {
      const response = await fetch('/api/user/limits');
      if (response.ok) {
        const data = await response.json();
        setLimits(data.videoLimits);
      }
    } catch (error) {
      console.error('Failed to fetch video limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDurationLimit = (durationSec: number): VideoLimitCheck => {
    if (!limits) {
      return {
        allowed: false,
        reason: 'Limits not loaded'
      };
    }

    if (limits.maxDuration === 0) {
      return {
        allowed: false,
        reason: 'Your plan does not support video generation'
      };
    }

    if (durationSec > limits.maxDuration) {
      return {
        allowed: false,
        reason: `Video is too long. Maximum for your plan is ${limits.maxDuration}s`
      };
    }

    return { allowed: true };
  };

  const checkGenerationLimit = (): VideoLimitCheck => {
    if (!limits) {
      return {
        allowed: false,
        reason: 'Limits not loaded'
      };
    }

    if (limits.remaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached your monthly limit of ${limits.maxVideosPerMonth} videos`,
        limitReached: true
      };
    }

    return { allowed: true };
  };

  const checkDemoLimit = (): VideoLimitCheck => {
    // Demo users: 1 video/24h, max 15s
    return {
      allowed: true,
      reason: 'Demo limit: 1 video per 24 hours, max 15s'
    };
  };

  return {
    limits,
    loading,
    checkDurationLimit,
    checkGenerationLimit,
    checkDemoLimit,
    refreshLimits: fetchLimits
  };
}

