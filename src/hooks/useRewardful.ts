import { useState, useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rewardful: any;
    Rewardful: {
      referral: string | null;
    };
  }
}

export function useRewardful() {
  const [referral, setReferral] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Rewardful is already loaded
    if (typeof window !== 'undefined' && window.rewardful) {
      window.rewardful('ready', function() {
        setReferral(window.Rewardful.referral);
        setIsReady(true);
      });
    } else {
      // If not loaded yet, wait for it
      const checkRewardful = () => {
        if (typeof window !== 'undefined' && window.rewardful) {
          window.rewardful('ready', function() {
            setReferral(window.Rewardful.referral);
            setIsReady(true);
          });
        } else {
          // Retry after a short delay
          setTimeout(checkRewardful, 100);
        }
      };
      checkRewardful();
    }
  }, []);

  return {
    referral,
    isReady,
  };
}


