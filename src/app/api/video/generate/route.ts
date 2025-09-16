import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { escapeDrawtextText, ensureTmp, execFfmpeg } from '@/subtitles/ffmpeg-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


type Body = {
  r2Key?: string;
  demoFile?: string;
  text?: string;
  style?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { r2Key, demoFile, text }: Body = await req.json();

    const now = Date.now();
    const inputTmpPath = `/tmp/in-${now}.mp4`;
    const outputTmpPath = `/tmp/out-${now}.mp4`;

    // Source resolution: R2 preferred
    let inputPath: string;
    if (r2Key) {
      try {
        const { getStorage } = await import('@/lib/storage/r2');
        const storage = getStorage();
        const data = await storage.downloadFile(r2Key);
        ensureTmp(inputTmpPath);
        fs.writeFileSync(inputTmpPath, data);
        inputPath = inputTmpPath;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to download from R2';
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    } else {
      // Demo file handling with slugify for safety
      const demoFileName = demoFile && demoFile.trim() !== '' ? demoFile : 'demo.mp4';
      const slugifiedName = demoFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const rel = `demo/videos/${slugifiedName}`;
      inputPath = path.join(process.cwd(), 'public', rel);
      try {
        await fs.promises.access(inputPath, fs.constants.R_OK);
      } catch {
        return Response.json({ ok: false, error: `DEMO_FILE_NOT_FOUND: ${rel}` }, { status: 404 });
      }
    }

    // Font path: prefer Inter-Regular.ttf, fallback to Inter.ttf
    const primaryFontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
    const fallbackFontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter.ttf');
    let fontPath = primaryFontPath;
    try {
      await fs.promises.access(fontPath, fs.constants.R_OK);
    } catch {
      try {
        await fs.promises.access(fallbackFontPath, fs.constants.R_OK);
        fontPath = fallbackFontPath;
      } catch {
        return Response.json({ ok: false, error: 'FONT_MISSING' }, { status: 500 });
      }
    }

    const subtitleText = escapeDrawtextText(text && text.trim() ? text : 'Sample subtitle');

    const vf = `drawtext=fontfile='${fontPath}':text='${subtitleText}':fontsize=48:fontcolor=#FFFFFF:x=(w-text_w)/2:y=h-180:box=1:boxcolor=#1E1E1ECC:boxborderw=5:borderw=3:bordercolor=#9146FF:line_spacing=10:alpha='if(lt(t,0.25), t/0.25, 1)'`;

    ensureTmp(outputTmpPath);

    try {
      const { stderr } = await execFfmpeg([
        '-y',
        '-i', inputPath,
        '-vf', vf,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputTmpPath,
      ]);
      if (stderr) {
        // Keep minimal logging in server output for troubleshooting
        console.log('[ffmpeg] stderr length:', stderr.length);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FFmpeg failed';
      return Response.json({ ok: false, error: message }, { status: 500 });
    }

    // Upload result to R2
    let storageKey: string;
    try {
      const data = await fs.promises.readFile(outputTmpPath);
      const key = `demo/${Date.now()}-${crypto.randomUUID()}.mp4`;
      const { getStorage } = await import('@/lib/storage/r2');
      const storage = getStorage();
      await storage.uploadFile(key, data, 'video/mp4');
      storageKey = key;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to upload to R2';
      return Response.json({ ok: false, error: message }, { status: 500 });
    } finally {
      // Best-effort cleanup
      try {
        if (fs.existsSync(inputTmpPath)) {
          fs.unlinkSync(inputTmpPath);
        }
      } catch {}
      try {
        if (fs.existsSync(outputTmpPath)) {
          fs.unlinkSync(outputTmpPath);
        }
      } catch {}
    }

    return Response.json({ ok: true, storageKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
