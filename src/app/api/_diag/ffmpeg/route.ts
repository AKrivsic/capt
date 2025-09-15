export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFfmpegPath } from '@/server/media/ffmpeg';
import { access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';

export async function GET() {
  try {
    const p = await getFfmpegPath();
    let executable = false;
    try { 
      await access(p, FS.X_OK); 
      executable = true; 
    } catch {}
    return NextResponse.json({ ok: true, ffmpegPath: p, executable, runtime: 'nodejs' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
