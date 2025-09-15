// src/server/media/ffmpeg.ts
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

export interface ExtractAudioOpts {
  inputPath: string;
  outputPath: string;
  sampleRate?: number; // default 16000
  channels?: 1 | 2;    // default 1
}

export async function extractAudioPcmWav(opts: ExtractAudioOpts): Promise<void> {
  const { inputPath, outputPath, sampleRate = 16000, channels = 1 } = opts;
  if (!ffmpegPath) throw new Error('ffmpeg-static path not resolved');

  const args = [
    '-nostdin',
    '-hide_banner',
    '-loglevel', 'error',
    '-i', inputPath,
    '-vn',
    '-acodec', 'pcm_s16le',
    '-ar', String(sampleRate),
    '-ac', String(channels),
    outputPath,
    '-y',
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
