import { NextResponse } from 'next/server';
import { runCleanupR2 } from '@/server/cron/cleanupR2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await runCleanupR2();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
