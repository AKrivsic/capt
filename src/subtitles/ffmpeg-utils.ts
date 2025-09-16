import fs from 'fs';
import path from 'path';

export function getFfmpegPath(): string {
  // Prefer vendored binary if present
  const vendorPath = path.join(process.cwd(), 'vendor', 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(vendorPath)) return vendorPath;
  // Fallback to ffmpeg-static if installed
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath = require('ffmpeg-static');
    if (typeof staticPath === 'string' && fs.existsSync(staticPath)) return staticPath;
  } catch {
    // ignore
  }
  return 'ffmpeg';
}

export function escapeDrawtextText(input: string): string {
  // Escape characters required by drawtext
  return input.replace(/:/g, '\\:').replace(/'/g, "\\'");
}

export function ensureTmp(targetFilePath: string): void {
  const dir = path.dirname(targetFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


