import 'server-only';

import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { access, chmod, readFile, writeFile, stat } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { once } from 'node:events';
import { join } from 'node:path';
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

async function fileSize(p: string): Promise<number | null> {
  try {
    const s = await stat(p);
    return s.size ?? null;
  } catch {
    return null;
  }
}

async function canWriteTmp(): Promise<boolean> {
  try {
    const test = join(tmpdir(), `_ffprobe_${Date.now()}`);
    await writeFile(test, 'ok');
    await chmod(test, 0o644).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function prepareTmpExec(srcPath: string): Promise<string> {
  const dst = join(tmpdir(), 'ffmpeg');
  try {
    const buf = await readFile(srcPath);
    await writeFile(dst, buf, { mode: 0o755 });
    await chmod(dst, 0o755).catch(() => {});
    await access(dst, FS.X_OK);
    return dst;
  } catch (e) {
    // Detailed diagnostics
    console.error(
      '[ffmpeg:prepareTmpExec]',
      'srcPath=', srcPath,
      'size=', await fileSize(srcPath),
      'tmpWritable=', await canWriteTmp(),
      'error=', e
    );
    throw new Error(`Failed to prepare tmp ffmpeg at ${dst}`);
  }
}

async function vendorPathForCurrentArch(): Promise<string | null> {
  if (process.platform !== 'linux') return null;
  const archDir = process.arch === 'arm64' ? 'linux-arm64' : 'linux-x64';
  const pathCandidate = join(process.cwd(), 'vendor', 'ffmpeg', archDir, 'ffmpeg');
  try {
    await access(pathCandidate, FS.X_OK);
    return pathCandidate;
  } catch {
    return pathCandidate;
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

  // Try vendor binary based on current architecture
  const vendorPath = await vendorPathForCurrentArch();
  if (vendorPath) {
    if (await isExecutable(vendorPath)) {
      RESOLVED = vendorPath;
      return RESOLVED;
    }
    try {
      const tmpExec = await prepareTmpExec(vendorPath);
      if (await isExecutable(tmpExec)) {
        RESOLVED = tmpExec;
        return RESOLVED;
      }
    } catch {
      // fallthrough; diagnostics already logged in prepareTmpExec
    }
  }

  if (staticPath) {
    try {
      const tmpExec = await prepareTmpExec(staticPath);
      if (await isExecutable(tmpExec)) {
        RESOLVED = tmpExec;
        return RESOLVED;
      }
    } catch {
      // prepareTmpExec logs details; fallthrough to final error
    }
  }

  const staticSize = staticPath ? await fileSize(staticPath) : null;
  throw new Error(
    `No executable ffmpeg found. Tried FFMPEG_PATH=${envPath ?? 'unset'} and ffmpeg-static${staticPath ? ` (${staticPath}, size=${staticSize})` : ' (null)' }.`
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
