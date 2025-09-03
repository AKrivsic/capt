import "server-only";
import { NextRequest } from "next/server";

// CAPTCHA configuration
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;
const HCAPTCHA_SITE_KEY = process.env.HCAPTCHA_SITE_KEY;

// Rate limiting for CAPTCHA failures
const CAPTCHA_FAILURE_LIMIT = 5; // max failures per IP per hour
const captchaFailures = new Map<string, { count: number; resetTime: number }>();

interface CaptchaValidationResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

export async function validateCaptcha(
  request: NextRequest,
  ip: string
): Promise<CaptchaValidationResult> {
  // Check if CAPTCHA is enabled
  if (!HCAPTCHA_SECRET || !HCAPTCHA_SITE_KEY) {
    console.warn("CAPTCHA not configured, skipping validation");
    return { success: true };
  }

  // Check rate limiting for CAPTCHA failures
  const now = Date.now();
  const failureKey = `captcha_fail:${ip}`;
  const failureRecord = captchaFailures.get(failureKey);
  
  if (failureRecord && now < failureRecord.resetTime) {
    if (failureRecord.count >= CAPTCHA_FAILURE_LIMIT) {
      return { 
        success: false, 
        error: "CAPTCHA_RATE_LIMITED",
        rateLimited: true 
      };
    }
  } else {
    // Reset counter if hour has passed
    captchaFailures.set(failureKey, { count: 0, resetTime: now + 60 * 60 * 1000 });
  }

  // Extract CAPTCHA token from request
  const token = request.headers.get("x-captcha-token") || 
                request.nextUrl?.searchParams.get("captcha_token") ||
                (await request.json().catch(() => ({}))).captcha_token;

  if (!token) {
    return { success: false, error: "CAPTCHA_TOKEN_MISSING" };
  }

  try {
    // Validate with hCaptcha
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: token,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return { success: true };
    } else {
      // Increment failure counter
      const record = captchaFailures.get(failureKey)!;
      record.count++;
      
      return { 
        success: false, 
        error: "CAPTCHA_VALIDATION_FAILED",
        rateLimited: record.count >= CAPTCHA_FAILURE_LIMIT
      };
    }
  } catch (error) {
    console.error("CAPTCHA validation error:", error);
    return { success: false, error: "CAPTCHA_SERVICE_ERROR" };
  }
}

// Middleware function for CAPTCHA enforcement
export function requireCaptcha(plan: string | null): boolean {
  // Require CAPTCHA for FREE tier and unauthenticated users
  return !plan || plan === "FREE";
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of captchaFailures.entries()) {
    if (now > record.resetTime) {
      captchaFailures.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

// Export types
export type { CaptchaValidationResult };
