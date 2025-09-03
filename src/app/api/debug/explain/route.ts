export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { withDb } from "@/lib/db-pool";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const result = await withDb(async (prisma) => {
      // Execute EXPLAIN ANALYZE
      const explainResult = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
      
      // Get actual execution stats
      const statsResult = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query}`);
      
      return {
        explain: explainResult,
        stats: statsResult,
        query: query,
        timestamp: new Date().toISOString(),
      };
    });

    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Predefined query analysis
export async function GET() {
  try {
    const commonQueries = [
      {
        name: "User History (most common)",
        query: `SELECT * FROM "History" WHERE "userId" = 'test-user' ORDER BY "createdAt" DESC LIMIT 10`,
        description: "Most frequent query - user history with pagination"
      },
      {
        name: "Usage Check (rate limiting)",
        query: `SELECT * FROM "Usage" WHERE "userId" = 'test-user' AND "date" = '2025-09-03' AND "kind" = 'GENERATION'`,
        description: "Rate limiting check - should use composite index"
      },
      {
        name: "User Plan Status",
        query: `SELECT * FROM "User" WHERE "plan" = 'STARTER' AND "status" = 'active'`,
        description: "Billing queries - should use partial index"
      },
      {
        name: "Webhook Events",
        query: `SELECT * FROM "WebhookEvent" WHERE "source" = 'stripe' ORDER BY "createdAt" DESC LIMIT 100`,
        description: "Webhook processing - should use source + created index"
      }
    ];

    return NextResponse.json({
      queries: commonQueries,
      instructions: "Use POST with query parameter to analyze specific queries",
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
