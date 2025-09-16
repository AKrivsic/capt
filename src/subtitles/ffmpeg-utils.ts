import fs from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';

const access = promisify(fs.access);
const constants = fs.constants;

export async function getFfmpegPath(): Promise<string> {
  // Prefer vendored binary if present
  const vendorPath = path.join(process.cwd(), 'vendor', 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  try {
    await access(vendorPath, constants.X_OK);
    return vendorPath;
  } catch {
    // Fallback to ffmpeg-static if installed
    if (typeof ffmpegStatic === 'string') {
      try {
        await access(ffmpegStatic, constants.X_OK);
        return ffmpegStatic;
      } catch {
        // Final fallback
        return 'ffmpeg';
      }
    }
    return 'ffmpeg';
  }
}

export async function getFfprobePath(): Promise<string> {
  // 1) vendor/ffprobe pokud existuje v balíčku
  const vendor = path.join(process.cwd(), 'vendor', 'ffprobe', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  try { 
    await access(vendor, constants.X_OK); 
    return vendor; 
  } catch {}
  
  // 2) fallback na ffprobe-static
  const staticPath = require('ffprobe-static')?.path as string | undefined; // eslint-disable-line
  if (!staticPath) throw new Error('FFPROBE_NOT_FOUND');
  return staticPath;
}

export function escapeDrawtextText(input: string): string {
  // Escape characters required by drawtext - comprehensive escaping
  return input
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

export function ensureTmp(targetFilePath: string): void {
  const dir = path.dirname(targetFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// New flexible version for variadic args
export async function ensureTmpPath(...segments: string[]): Promise<string> {
  const full = path.join('/tmp', ...segments);
  const dir = path.dirname(full);
  await fs.promises.mkdir(dir, { recursive: true });
  return full;
}

export async function execFfmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);
  
  const ffmpegPath = await getFfmpegPath();
  
  try {
    const { stdout, stderr } = await execFileAsync(ffmpegPath, args, { 
      env: process.env,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Better error detection in stderr
    if (stderr?.match(/Error/i)) {
      console.warn('[ffmpeg] Error detected in stderr:', stderr);
    } else if (stderr && process.env.DEBUG_FFMPEG === '1') {
      console.log('[ffmpeg] stderr:', stderr);
    }
    
    return { stdout, stderr };
  } catch (error) {
    console.error('[ffmpeg] execution failed:', error);
    throw error;
  }
}


