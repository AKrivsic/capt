import 'server-only';

import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { access, chmod, copyFile } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { once } from 'node:events';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

let RESOLVED: string | null = null;

async function isExecutable(p?: string | null): Promise<boolean> {
  if (!p) return false;
  try {
    await access(p, FS.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureTmpExecutable(srcPath: string): Promise<string> {
  const name = basename(srcPath) || 'ffmpeg';
  const dst = join(tmpdir(), name);
  try {
    if (await isExecutable(dst)) return dst;
    await chmod(dst, 0o755).catch(async () => {
      await copyFile(srcPath, dst);
      await chmod(dst, 0o755);
    });
    return dst;
  } catch {
    if (await isExecutable(dst)) return dst;
    throw new Error(`Failed to prepare tmp ffmpeg at ${dst}`);
  }
}

export async function getFfmpegPath(): Promise<string> {
  if (RESOLVED) return RESOLVED;

  const envPath = process.env.FFMPEG_PATH || null;
  if (await isExecutable(envPath)) {
    RESOLVED = envPath!;
    return RESOLVED;
  }

  const staticPath = (ffmpegStatic as unknown as string) || null;
  if (await isExecutable(staticPath)) {
    RESOLVED = staticPath!;
    return RESOLVED;
  }

  if (staticPath) {
    const tmpExec = await ensureTmpExecutable(staticPath);
    if (await isExecutable(tmpExec)) {
      RESOLVED = tmpExec;
      return RESOLVED;
    }
  }

  throw new Error(
    `No executable ffmpeg found. Tried FFMPEG_PATH=${envPath ?? 'unset'} and ffmpeg-static${staticPath ? ` (${staticPath})` : ''}.`
  );
}

export interface ExtractAudioOpts {
  inputPath: string;
  outputPath: string;
  sampleRate?: number; // default 16000
  channels?: 1 | 2;    // default 1
}

export async function extractAudioPcmWav(opts: ExtractAudioOpts): Promise<void> {
  const { inputPath, outputPath, sampleRate = 16000, channels = 1 } = opts;
  const ffmpegPath = await getFfmpegPath();

  if (process.env.DEBUG_FFMPEG_PATH === '1') {
    console.log('[ffmpeg] using binary at:', ffmpegPath);
  }

  const args = [
    '-nostdin', '-hide_banner', '-loglevel', 'error',
    '-i', inputPath, '-vn',
    '-acodec', 'pcm_s16le', '-ar', String(sampleRate), '-ac', String(channels),
    outputPath, '-y',
  ];

  const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d) => (stderr += d));

  const [code] = (await once(child, 'close')) as [number];
  if (code !== 0) {
    const err = new Error(`ffmpeg failed (code ${code}): ${stderr}`) as Error & { code: number };
    err.code = code;
    throw err;
  }
}
