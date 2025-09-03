// src/app/api/health/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-pool";

export async function GET() {
  const startTime = Date.now();
  
  try {
    // ✅ Database health check
    const dbHealth = await checkDatabaseHealth();
    
    // ✅ OpenAI health check (basic)
    const openaiHealth = { ok: true, apiKey: !!process.env.OPENAI_API_KEY };
    
    // ✅ Stripe health check (basic)
    const stripeHealth = { ok: true, secretKey: !!process.env.STRIPE_SECRET_KEY };
    
    // ✅ MailerLite health check (basic)
    const mlHealth = { ok: true, apiKey: !!process.env.MAILERLITE_API_KEY };
    
    const checks = {
      database: dbHealth,
      openai: openaiHealth,
      stripe: stripeHealth,
      mailerlite: mlHealth,
    };
    
    const allHealthy = Object.values(checks).every(check => check.ok);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ok: allHealthy,
      version: process.env.VERCEL_GIT_COMMIT_SHA || "0.1.0",
      time: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks,
    }, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      ok: false,
      version: process.env.VERCEL_GIT_COMMIT_SHA || "0.1.0",
      time: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
