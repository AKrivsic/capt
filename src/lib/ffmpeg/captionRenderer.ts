/**
 * FFmpeg caption renderer s pozicováním titulků + jednoduché animace (fade)
 */

import type { 
  CaptionPosition, 
  LayoutInput, 
  CaptionLayout 
} from '@/types/captionPosition';
import { computeY } from '@/utils/layout';

export interface CaptionRenderOptions {
  videoWidth: number;
  videoHeight: number;
  position: CaptionPosition;
  avoidOverlays: boolean;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  lineHeight: number;
  maxWidth: number;
  text: string;
  /** 🔥 Přidáno: volitelná animace. Implementováno: 'fade' (alpha ramp), ostatní zatím no-op. */
  animation?: 'fade' | 'bounce' | 'pop' | 'glitch' | string;
}

export interface FFmpegCaptionFilter {
  filter: string;
  parameters: Record<string, string | number>;
}

export interface FFmpegComplexFilter {
  mode: 'vf' | 'complex';
  filters: string[];
  maps?: string[];
}

/** Escapování pro drawtext */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Vygeneruje výraz pro alpha podle animace */
function alphaExpr(animation?: CaptionRenderOptions['animation']): string | undefined {
  if (!animation) return undefined;
  switch (animation) {
    case 'fade':
      // 0 → 1 během prvních 0.25s
      return "if(lt(t,0.25), t/0.25, 1)";
    case 'bounce':
    case 'pop':
      // Fade + bounce/pop animace
      return "if(lt(t,0.25), t/0.25, 1)";
    default:
      return undefined;
  }
}

/** Vygeneruje Y offset výraz pro bounce animaci */
function bounceYExpr(baseY: number, animation?: CaptionRenderOptions['animation']): string {
  if (animation === 'bounce' || animation === 'pop') {
    // Tlumený sinus s exponenciálním útlumem
    return `${baseY} - (20*sin(6.2832*min(t,0.4)/0.25)*exp(-4*min(t,0.4)))`;
  }
  return String(baseY);
}

/**
 * Vytvoří FFmpeg drawtext filter pro titulky (single-line)
 */
export function createCaptionFilter(options: CaptionRenderOptions): FFmpegCaptionFilter {
  const {
    videoWidth,
    videoHeight,
    position,
    avoidOverlays,
    fontSize,
    fontFamily,
    textColor,
    backgroundColor,
    outlineColor,
    outlineWidth = 2,
    lineHeight,
    maxWidth: _maxWidth, // eslint-disable-line @typescript-eslint/no-unused-vars
    text,
    animation,
  } = options;

  const layoutInput: LayoutInput = {
    videoWidth,
    videoHeight,
    position,
    lineHeightPx: fontSize * lineHeight,
    linesCount: Math.ceil(text.length / 30),
    avoidOverlays,
  };

  const layout: CaptionLayout = computeY(layoutInput);
  const baseY = layout.y;

  const parameters: Record<string, string | number> = {
    text: `'${esc(text)}'`,
    fontsize: fontSize,
    fontcolor: textColor,
    x: '(w-text_w)/2',
    y: bounceYExpr(baseY, animation),
    box: backgroundColor ? 1 : 0,
    boxcolor: backgroundColor || 'black@0.0',
    boxborderw: 5,
    borderw: outlineWidth,
    bordercolor: outlineColor || 'black',
    line_spacing: Math.max(0, Math.round(fontSize * (lineHeight - 1))),
  };

  // Přidání font parametru
  if (fontFamily.includes('.ttf') || fontFamily.includes('.otf')) {
    parameters.fontfile = `'${esc(fontFamily)}'`;
  } else {
    parameters.font = `'${esc(fontFamily)}'`;
  }

  const a = alphaExpr(animation);
  if (a) parameters.alpha = `'${a}'`;

  return { filter: 'drawtext', parameters };
}

/**
 * Vytvoří FFmpeg filter pro glitch animaci
 */
export function createGlitchFilter(options: CaptionRenderOptions): FFmpegComplexFilter {
  const {
    videoWidth,
    videoHeight,
    position,
    avoidOverlays,
    fontSize,
    fontFamily,
    textColor,
    backgroundColor,
    outlineColor,
    outlineWidth = 2,
    lineHeight,
    text,
  } = options;

  const layoutInput: LayoutInput = {
    videoWidth,
    videoHeight,
    position,
    lineHeightPx: fontSize * lineHeight,
    linesCount: Math.ceil(text.length / 30),
    avoidOverlays,
  };

  const layout: CaptionLayout = computeY(layoutInput);
  const baseY = layout.y;

  // Base text layer
  const baseParams: Record<string, string | number> = {
    text: `'${esc(text)}'`,
    fontsize: fontSize,
    fontcolor: textColor,
    x: '(w-text_w)/2',
    y: String(baseY),
    box: backgroundColor ? 1 : 0,
    boxcolor: backgroundColor || 'black@0.0',
    boxborderw: 5,
    borderw: outlineWidth,
    bordercolor: outlineColor || 'black',
    line_spacing: Math.max(0, Math.round(fontSize * (lineHeight - 1))),
  };

  if (fontFamily.includes('.ttf') || fontFamily.includes('.otf')) {
    baseParams.fontfile = `'${esc(fontFamily)}'`;
  } else {
    baseParams.font = `'${esc(fontFamily)}'`;
  }

  const baseFilter = `drawtext=${Object.entries(baseParams).map(([k, v]) => `${k}=${v}`).join(':')}`;

  // Red offset layer (glitch effect)
  const redParams: Record<string, string | number> = { ...baseParams };
  redParams.fontcolor = 'red';
  redParams.x = `(w-text_w)/2+3`;
  redParams.y = `${baseY}+2`;
  redParams.enable = `'lt(t,0.18)'`;

  const redFilter = `drawtext=${Object.entries(redParams).map(([k, v]) => `${k}=${v}`).join(':')}`;

  // Cyan offset layer
  const cyanParams: Record<string, string | number > = { ...baseParams };
  cyanParams.fontcolor = 'cyan';
  cyanParams.x = `(w-text_w)/2-3`;
  cyanParams.y = `${baseY}-2`;
  cyanParams.enable = `'lt(t,0.18)'`;

  const cyanFilter = `drawtext=${Object.entries(cyanParams).map(([k, v]) => `${k}=${v}`).join(':')}`;

  return {
    mode: 'complex',
    filters: [baseFilter, redFilter, cyanFilter],
    maps: ['[vout]', '0:a?']
  };
}

/**
 * Vytvoří kompletní FFmpeg command pro rendering titulků
 */
export function createFFmpegCommand(
  inputVideoPath: string,
  outputVideoPath: string,
  captionOptions: CaptionRenderOptions
): string {
  // Rozhodnutí o typu filtru podle animace
  if (captionOptions.animation === 'glitch') {
    const complexFilter = createGlitchFilter(captionOptions);
    
    const command = [
      'ffmpeg',
      '-y',
      '-i', `"${inputVideoPath}"`,
      '-filter_complex', `"${complexFilter.filters.join(',')}"`,
      '-map', `"${complexFilter.maps![0]}"`,
      '-map', `"${complexFilter.maps![1]}"`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      `"${outputVideoPath}"`
    ].join(' ');

    return command;
  } else {
    // Standardní drawtext filter
    const captionFilter = createCaptionFilter(captionOptions);

    const filterParams = Object.entries(captionFilter.parameters)
      .map(([key, value]) => `${key}=${value}`)
      .join(':');

    const filterString = `${captionFilter.filter}=${filterParams}`;

    const command = [
      'ffmpeg',
      '-y',
      '-i', `"${inputVideoPath}"`,
      '-vf', `"${filterString}"`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      `"${outputVideoPath}"`
    ].join(' ');

    return command;
  }
}

/**
 * Vytvoří víceřádkové titulky s automatickým zalamováním
 */
export function createMultilineCaptionFilter(
  options: CaptionRenderOptions,
  lines: string[]
): FFmpegCaptionFilter {
  const {
    videoWidth,
    videoHeight,
    position,
    avoidOverlays,
    fontSize,
    fontFamily,
    textColor,
    backgroundColor,
    outlineColor,
    outlineWidth = 2,
    lineHeight,
    animation,
  } = options;

  const layoutInput: LayoutInput = {
    videoWidth,
    videoHeight,
    position,
    lineHeightPx: fontSize * lineHeight,
    linesCount: lines.length,
    avoidOverlays,
  };

  const layout: CaptionLayout = computeY(layoutInput);
  const y = layout.y;

  const multilineText = lines.join('\\n');

  const parameters: Record<string, string | number> = {
    text: `'${esc(multilineText)}'`,
    fontfile: `'${esc(fontFamily)}'`,
    fontsize: fontSize,
    fontcolor: textColor,
    x: '(w-text_w)/2',
    y,
    box: backgroundColor ? 1 : 0,
    boxcolor: backgroundColor || 'black@0.0',
    boxborderw: 5,
    borderw: outlineWidth,
    bordercolor: outlineColor || 'black',
    line_spacing: Math.max(0, Math.round(fontSize * (lineHeight - 1))),
  };

  const a = alphaExpr(animation);
  if (a) parameters.alpha = `'${a}'`;

  return { filter: 'drawtext', parameters };
}
