import fs from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import { promisify } from 'util';

const access = promisify(fs.access);
const constants = fs.constants;

export async function getFfmpegPath(): Promise<string> {
  // Prefer ffmpeg-static (has drawtext filter) over vendor binary
  if (typeof ffmpegStatic === 'string') {
    try {
      await access(ffmpegStatic, constants.X_OK);
      console.log('[FFMPEG_DEBUG] Using ffmpeg-static:', ffmpegStatic);
      return ffmpegStatic;
    } catch {
      console.log('[FFMPEG_DEBUG] ffmpeg-static not accessible');
    }
  }
  
  // Fallback to vendor binary (may be missing drawtext filter)
  const vendorPath = path.join(process.cwd(), 'vendor', 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  try {
    await access(vendorPath, constants.X_OK);
    console.log('[FFMPEG_DEBUG] Using vendor ffmpeg:', vendorPath);
    return vendorPath;
  } catch {
    console.log('[FFMPEG_DEBUG] Vendor ffmpeg not found');
  }
  
  // Final fallback
  console.log('[FFMPEG_DEBUG] Using system ffmpeg');
  return 'ffmpeg';
}

export async function getFfprobePath(): Promise<string> {
  console.log('[FFPROBE_DEBUG] getFfprobePath() called');
  
  // 1) vendor/ffprobe pokud existuje v balíčku
  const vendor = path.join(process.cwd(), 'vendor', 'ffprobe', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  try { 
    await access(vendor, constants.X_OK);
    console.log('[FFPROBE_DEBUG] Using vendor ffprobe:', vendor);
    return vendor; 
  } catch {
    console.log('[FFPROBE_DEBUG] Vendor ffprobe not found, trying ffprobe-static');
  }
  
  // 2) fallback na ffprobe-static
  const ffprobeStatic = require('ffprobe-static'); // eslint-disable-line
  if (!ffprobeStatic || !ffprobeStatic.path) {
    console.error('[FFPROBE_DEBUG] FFPROBE_NOT_FOUND - no ffprobe-static path');
    throw new Error('FFPROBE_NOT_FOUND');
  }
  
  // ffprobe-static.path může vracet špatnou cestu v serverless prostředí
  const staticPath = ffprobeStatic.path as string;
  console.log('[FFPROBE_DEBUG] ffprobe-static.path returned:', staticPath);
  
  // Pokud cesta obsahuje .next/server, zkusme najít správnou cestu
  if (staticPath.includes('.next/server')) {
    console.log('[FFPROBE_DEBUG] Detected .next/server path, trying to find correct path');
    
    // Zkusme různé možné cesty k ffprobe binárce
    const possiblePaths = [
      // Standardní cesty
      path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x64', 'ffprobe'),
      path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', process.platform, process.arch, 'ffprobe'),
      path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x86_64', 'ffprobe'),
      
      // Alternativní cesty
      path.join('/var/task', 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x64', 'ffprobe'),
      path.join('/var/task', 'node_modules', 'ffprobe-static', 'bin', process.platform, process.arch, 'ffprobe'),
      
      // Fallback na systémový ffprobe
      '/usr/bin/ffprobe',
      '/usr/local/bin/ffprobe',
    ];
    
    for (const testPath of possiblePaths) {
      try {
        await access(testPath, constants.X_OK);
        console.log('[FFPROBE_DEBUG] Found ffprobe at:', testPath);
        return testPath;
      } catch {
        console.log('[FFPROBE_DEBUG] Path not found:', testPath);
      }
    }
    
    console.error('[FFPROBE_DEBUG] No valid ffprobe path found in any of the tested locations');
    throw new Error('FFPROBE_NOT_FOUND - no valid path found');
  }
  
  console.log('[FFPROBE_DEBUG] Using original ffprobe-static path:', staticPath);
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


