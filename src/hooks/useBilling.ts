import { useState } from 'react';
import { Plan } from '@prisma/client';

interface BillingResponse {
  sessionId: string;
  url: string;
}

interface BillingError {
  error: string;
  message: string;
}

export function useBilling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async (
    plan: Plan,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<BillingResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData: BillingError = await response.json();
        throw new Error(errorData.message || 'Error creating subscription');
      }

      const data: BillingResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Billing error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (
    sku: 'EXTRA_10_VIDEOS' | 'EXTRA_25_VIDEOS' | 'EXTRA_50_VIDEOS',
    successUrl?: string,
    cancelUrl?: string
  ): Promise<BillingResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku,
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData: BillingError = await response.json();
        throw new Error(errorData.message || 'Error creating payment');
      }

      const data: BillingResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Billing error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const redirectToCheckout = (url: string) => {
    window.location.href = url;
  };

  const startCheckout = async (plan: Plan): Promise<void> => {
    const result = await createSubscription(plan);
    if (result) {
      redirectToCheckout(result.url);
    }
  };

  return {
    loading,
    error,
    createSubscription,
    createPaymentIntent,
    redirectToCheckout,
    startCheckout,
    clearError: () => setError(null),
  };
}
