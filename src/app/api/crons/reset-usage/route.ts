import { NextResponse } from "next/server";
import { runResetUsage } from "@/server/cron/resetUsage";

export async function GET() {
  const res = await runResetUsage();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
