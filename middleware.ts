import { NextRequest, NextResponse } from "next/server";
import { Redis } from "ioredis";

// Rate limiting configuration
const RATE_LIMITS = {
  // API endpoints
  "/api/generate": { requests: 10, window: 60 }, // 10 requests per minute
  "/api/video/generate": { requests: 5, window: 60 }, // 5 requests per minute
  "/api/stripe/checkout": { requests: 3, window: 60 }, // 3 requests per minute
  "/api/auth/signin": { requests: 5, window: 60 }, // 5 signin attempts per minute
  "/api/auth/signup": { requests: 3, window: 60 }, // 3 signup attempts per minute
  
  // General API protection
  "/api/": { requests: 30, window: 60 }, // 30 requests per minute for any API
};

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();
  
  return "unknown";
}

// Initialize Redis connection
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis && process.env.KV_REST_API_REDIS_URL) {
    try {
      redis = new Redis(process.env.KV_REST_API_REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
    }
  }
  return redis;
}

async function checkRateLimit(
  key: string, 
  limit: number, 
  window: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const redisClient = getRedis();
    if (!redisClient) {
      // Fail open if Redis is not available
      return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
    }

    const current = await redisClient.incr(key);
    
    if (current === 1) {
      // First request - set expiration
      await redisClient.expire(key, window);
    }
    
    const remaining = Math.max(0, limit - current);
    const resetTime = Date.now() + (window * 1000);
    
    return {
      allowed: current <= limit,
      remaining,
      resetTime
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if Redis is down
    return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check rate limits for API endpoints
  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(req);
    
    // Find matching rate limit rule
    let rateLimit = null;
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
      if (pathname.startsWith(pattern)) {
        rateLimit = config;
        break;
      }
    }
    
    // Apply general API rate limit if no specific rule found
    if (!rateLimit && pathname.startsWith("/api/")) {
      rateLimit = RATE_LIMITS["/api/"];
    }
    
    if (rateLimit) {
      const key = `rate_limit:${ip}:${pathname}`;
      const result = await checkRateLimit(key, rateLimit.requests, rateLimit.window);
      
      if (!result.allowed) {
        const response = NextResponse.json(
          { 
            ok: false, 
            error: "RATE_LIMIT_EXCEEDED",
            message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        );
        
        response.headers.set("Retry-After", Math.ceil((result.resetTime - Date.now()) / 1000).toString());
        response.headers.set("X-RateLimit-Limit", rateLimit.requests.toString());
        response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
        response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());
        
        return response;
      }
      
      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", rateLimit.requests.toString());
      response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
      response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());
      
      return response;
    }
  }
  
  const res = NextResponse.next();
  
  // Security headers
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Content Security Policy
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://r.wdfl.co https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openai.com https://plausible.io https://www.google.com https://*.getrewardful.com https://*.resend.com https://*.mailerlite.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join("; ")
  );
  
  return res;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};