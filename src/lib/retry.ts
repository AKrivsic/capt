// src/lib/retry.ts
import "server-only";

interface RetryOptions {
  tries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: number;
}

/**
 * Exponential backoff s jitterem pro OpenAI API calls
 * Respektuje app timeout - celkový čas < LLM_TIMEOUT_MS
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    tries = 3,
    baseDelay = 300,
    maxDelay = 2000,
    jitter = 200,
  } = options;

  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      
      // Kontrola, zda je error retryable
      let status = 0;
      if (error && typeof error === 'object' && 'status' in error) {
        status = (error as { status: number }).status;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        status = response?.status || 0;
      }
      
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      
      // Pokud není retryable nebo vyčerpali jsme pokusy
      if (!isRetryable || attempt >= tries) {
        throw error;
      }
      
      // Exponential backoff s jitterem
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt - 1)
      ) + Math.random() * jitter;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Wrapper pro OpenAI API calls s retry logikou
 */
export async function openaiWithRetry<T>(
  apiCall: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return withBackoff(apiCall, {
    tries: 3,
    baseDelay: 500, // 500ms base delay
    maxDelay: 3000, // max 3s delay
    jitter: 300,    // 300ms jitter
    ...options,
  });
}
