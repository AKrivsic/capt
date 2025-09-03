export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { metrics } from "@/lib/metrics";

export async function GET() {
  try {
    const requestMetrics = metrics.getMetrics();
    const memoryMetrics = metrics.getMemoryMetrics();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || "0.1.0",
      metrics: {
        endpoints: requestMetrics,
        memory: memoryMetrics,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          env: process.env.NODE_ENV,
        },
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
