import { NextRequest } from 'next/server';
import { getFfmpegPath } from '@/server/media/ffmpeg';
import { getFfprobePath } from '@/subtitles/ffmpeg-utils';
import { spawn } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prisma } from '@/lib/prisma';
import { checkDemoVideoLimit, recordVideoUsage } from '@/lib/limits';
import { escapeDrawtextText } from '@/subtitles/ffmpeg-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Minimal local validation without ffprobe (placeholder)
function validateBasic(file: File): { ok: boolean; error?: string } {
  const maxBytes = 100 * 1024 * 1024; // 100MB
  if (file.size > maxBytes) return { ok: false, error: 'File too large (max 100MB)' };
  const name = file.name.toLowerCase();
  if (!name.endsWith('.mp4')) return { ok: false, error: 'Only MP4 files are supported' };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting and demo tracking
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    // Check demo video limits (1 video/24h per IP)
    const demoLimitCheck = await checkDemoVideoLimit(ip, prisma);
    if (!demoLimitCheck.allowed) {
      return Response.json({ 
        ok: false, 
        error: demoLimitCheck.reason,
        limitReached: demoLimitCheck.limitReached 
      }, { status: 429 });
    }

    // Check if this is a JSON request (for subtitle generation) or FormData (for upload)
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // JSON request - subtitle generation for existing video
      const body = await req.json();
      const { videoFileId, style, durationSec } = body;
      
      if (!videoFileId || !style || !durationSec) {
        return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
      }

      // For demo, return a mock result since we don't have the actual video processing
      return Response.json({
        ok: true,
        jobId: `demo-${Date.now()}`,
        status: 'COMPLETED',
        message: 'Demo video processing completed',
        isDemo: true,
        result: {
          processedVideoUrl: '/api/demo/preview/demo',
          subtitles: [
            { start: 0, end: 3, text: 'Welcome to Captioni' },
            { start: 3, end: 6, text: 'AI-powered subtitles' },
            { start: 6, end: 9, text: 'Made with love' }
          ],
          rawTranscript: { words: [], language: 'en', confidence: 0.95 },
          style: style,
          duration: durationSec,
          language: 'en',
          confidence: 0.95,
        },
      });
    }

    // FormData request - file upload
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: 'No file' }, { status: 400 });
    }

    // Basic checks (placeholder; replace with ffprobe based validation)
    const basic = validateBasic(file);
    if (!basic.ok) {
      return Response.json({ ok: false, error: basic.error }, { status: 400 });
    }

    // Save to tmp
    const dir = mkdtempSync(join(tmpdir(), 'demo-'));
    const inPath = join(dir, 'input.mp4');
    const outPath = join(dir, 'preview.mp4');
    const buf = Buffer.from(await file.arrayBuffer());
    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(inPath);
      ws.on('error', reject);
      ws.on('finish', () => resolve());
      ws.end(buf);
    });

    // Skip ffprobe validation in serverless environment
    // FFmpeg will handle video processing and validation
    console.log('[FFPROBE_DEBUG] Skipping ffprobe validation in serverless environment');
    // Skip video validation - let FFmpeg handle it during processing

    // Render watermark preview (text captioni.com top-right) with proper escaping
    const fontPath = join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
    const fallbackFontPath = join(process.cwd(), 'public', 'fonts', 'Inter.ttf');
    const actualFontPath = existsSync(fontPath) ? fontPath : fallbackFontPath;
    
    // Check font availability and return error if missing
    if (!existsSync(actualFontPath)) {
      return Response.json({ ok: false, error: 'FONT_MISSING' }, { status: 500 });
    }
    
    const fontArg = `:fontfile='${actualFontPath}'`;
    const watermarkText = escapeDrawtextText('captioni.com');
    const draw = `drawtext=text='${watermarkText}'${fontArg}:fontcolor=white@0.6:fontsize=28:x=w-tw-20:y=20`;
    const args = ['-y','-i', inPath, '-vf', draw, '-preset','veryfast','-c:v','libx264','-crf','18','-pix_fmt','yuv420p', outPath];
    const resolvedFfmpeg = await getFfmpegPath();
    await new Promise<void>((resolve, reject) => {
      const ps = spawn(resolvedFfmpeg, args);
      let err = '';
      ps.stderr.on('data', d => { err += d.toString(); });
      ps.on('close', code => {
        if (code === 0) resolve(); else reject(new Error(err || 'ffmpeg failed'));
      });
    });
    // TODO: Whisper transcription
    // TODO: Optional LLM keywords/style injection (feature-flag)
    // TODO: Render via FFmpeg with BARBIE/EDGY presets (watermark overlay)
    // TODO: Cache by SHA256 of upload

    // Record video usage for demo tracking (skip duration in serverless)
    await recordVideoUsage(null, ip, 15, prisma);

    // Upload to R2/S3
    try {
      const { getStorage } = await import('@/lib/storage/r2');
      const storage = getStorage();
      const key = `demo/previews/${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
      const fileBuf = readFileSync(outPath);
      await storage.uploadFile(key, fileBuf, 'video/mp4');
      const url = await storage.getPresignedDownloadUrl(key, 86400);
      return Response.json({ 
        ok: true, 
        preview: { 
          url, 
          watermark: true,
          durationSec: 15 
        } 
      });
    } catch {
      return Response.json({ 
        ok: true, 
        preview: { 
          url: '/api/demo/video/preview', 
          watermark: true,
          durationSec: 15 
        } 
      });
    }
  } catch {
    return Response.json({ ok: false, error: 'Render failed, please retry.' }, { status: 500 });
  }
}


