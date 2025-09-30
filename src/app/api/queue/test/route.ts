import { NextResponse } from 'next/server';

export async function GET() {
  // Deprecated endpoint: BullMQ queue test no longer available.
  return NextResponse.json({ error: 'Deprecated', message: 'BullMQ queue is deprecated' }, { status: 410 });
}