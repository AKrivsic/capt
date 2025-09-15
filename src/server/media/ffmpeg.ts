import 'server-only';

import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { once } from 'node:events';

let resolvedFfmpegPath: string | null = null;

async function fileIsExecutable(p: string): Promise<boolean> {
  try { 
    await access(p, FS.X_OK); 
    return true; 
  } catch { 
    return false; 
  }
}

export async function getFfmpegPath(): Promise<string> {
  if (resolvedFfmpegPath) return resolvedFfmpegPath;

  const envPath = process.env.FFMPEG_PATH;
  if (envPath && await fileIsExecutable(envPath)) {
    resolvedFfmpegPath = envPath;
    return resolvedFfmpegPath;
  }

  if (!ffmpegStatic) {
    throw new Error('ffmpeg-static not resolved and FFMPEG_PATH invalid/unset');
  }

  if (await fileIsExecutable(ffmpegStatic)) {
    resolvedFfmpegPath = ffmpegStatic;
    return resolvedFfmpegPath;
  }

  throw new Error(`No executable ffmpeg found. Tried FFMPEG_PATH=${envPath ?? 'unset'} and ffmpeg-static.`);
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

  // Jednorázový info log (pomůže ověřit, že běží ffmpeg-static, ne .next/chunks):
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_FFMPEG_PATH === '1') {
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
