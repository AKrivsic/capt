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
    default:
      return undefined; // ostatní animace zatím no-op
  }
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
  const y = layout.y;

  const parameters: Record<string, string | number> = {
    text: `'${esc(text)}'`,
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

/**
 * Vytvoří kompletní FFmpeg command pro rendering titulků
 */
export function createFFmpegCommand(
  inputVideoPath: string,
  outputVideoPath: string,
  captionOptions: CaptionRenderOptions
): string {
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
