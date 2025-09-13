// src/hooks/useDemoLimits.ts
"use client";

import { useState, useEffect } from 'react';
import { demoLimits, DemoLimitResult } from '@/lib/demoLimits';

export interface DemoLimitsState {
  remaining: number;
  resetTime: number | null;
  timeLeft: string;
  loading: boolean;
  error: string | null;
}

export function useDemoLimits() {
  const [state, setState] = useState<DemoLimitsState>({
    remaining: 2,
    resetTime: null,
    timeLeft: '',
    loading: true,
    error: null
  });

  const [lastCheck, setLastCheck] = useState<DemoLimitResult | null>(null);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [remaining, resetTime, timeLeft] = await Promise.all([
        demoLimits.getRemaining(),
        demoLimits.getResetTime(),
        demoLimits.formatTimeLeft()
      ]);

      setState({
        remaining,
        resetTime,
        timeLeft,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load demo limits:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load limits'
      }));
    }
  };

  const checkLimit = async (): Promise<DemoLimitResult> => {
    try {
      const result = await demoLimits.checkLimit();
      setLastCheck(result);
      
      // Update state after check
      await loadLimits();
      
      return result;
    } catch (error) {
      console.error('Failed to check demo limit:', error);
      const fallbackResult: DemoLimitResult = {
        allowed: true,
        remaining: 1,
        reason: 'Failed to check limits'
      };
      setLastCheck(fallbackResult);
      return fallbackResult;
    }
  };

  const getStatusText = (): string => {
    if (state.loading) return 'Loading...';
    if (state.error) return 'Error loading limits';
    if (state.remaining === 0) return 'Demo limit reached';
    if (state.remaining === 1) return '1 demo left';
    return `${state.remaining} demos left`;
  };

  const getResetText = (): string => {
    if (state.loading || state.error) return '';
    if (state.remaining === 2) return 'Full demo access';
    if (state.timeLeft) return `Resets in ${state.timeLeft}`;
    return 'Resets daily';
  };

  const isLimitReached = (): boolean => {
    return state.remaining === 0 && !state.loading && !state.error;
  };

  const canGenerate = (): boolean => {
    return state.remaining > 0 && !state.loading && !state.error;
  };

  return {
    ...state,
    lastCheck,
    checkLimit,
    loadLimits,
    getStatusText,
    getResetText,
    isLimitReached,
    canGenerate,
    // Debug info
    getDebugInfo: () => demoLimits.getDebugInfo()
  };
}
