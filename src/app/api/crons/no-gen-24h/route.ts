// src/app/api/crons/no-gen-24h/route.ts
import { NextResponse } from "next/server";
import { runNoGen24h } from "@/server/cron/noGen24h";

export async function GET() {
  const res = await runNoGen24h();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
