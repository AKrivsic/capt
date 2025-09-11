/**
 * FFmpeg caption renderer s pozicováním titulků
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
}

export interface FFmpegCaptionFilter {
  filter: string;
  parameters: Record<string, string | number>;
}

/**
 * Vytvoří FFmpeg drawtext filter pro titulky
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
  } = options;

  // Vypočítáme pozici pomocí naší utility funkce
  const layoutInput: LayoutInput = {
    videoWidth,
    videoHeight,
    position,
    lineHeightPx: fontSize * lineHeight,
    linesCount: Math.ceil(text.length / 30), // Odhad počtu řádků
    avoidOverlays,
  };

  const layout: CaptionLayout = computeY(layoutInput);
  const y = layout.y;

  // Sestavíme FFmpeg drawtext filter
  const parameters: Record<string, string | number> = {
    text: `'${text.replace(/'/g, "\\'")}'`,
    fontfile: `'${fontFamily}'`,
    fontsize: fontSize,
    fontcolor: textColor,
    x: '(w-text_w)/2', // Horizontálně vycentrované
    y: y,
    box: backgroundColor ? 1 : 0,
    boxcolor: backgroundColor || 'black@0.0',
    boxborderw: 5,
    borderw: outlineWidth,
    bordercolor: outlineColor || 'black',
    line_spacing: fontSize * (lineHeight - 1),
  };

  return {
    filter: 'drawtext',
    parameters,
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
  const captionFilter = createCaptionFilter(captionOptions);
  
  // Sestavíme parametry filtru
  const filterParams = Object.entries(captionFilter.parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join(':');

  const filterString = `${captionFilter.filter}=${filterParams}`;

  // Kompletní FFmpeg command
  const command = [
    'ffmpeg',
    '-i', `"${inputVideoPath}"`,
    '-vf', `"${filterString}"`,
    '-c:a', 'copy', // Kopírujeme audio beze změny
    '-c:v', 'libx264', // Video codec
    '-preset', 'fast', // Rychlé encoding
    '-crf', '23', // Kvalita videa
    '-y', // Přepiš výstupní soubor
    `"${outputVideoPath}"`
  ].join(' ');

  return command;
}

/**
 * Příklad použití s konkrétními hodnotami
 */
export function getExampleFFmpegCommand(): string {
  const exampleOptions: CaptionRenderOptions = {
    videoWidth: 1080,
    videoHeight: 1920, // TikTok/IG Stories rozměry
    position: 'BOTTOM',
    avoidOverlays: true,
    fontSize: 48,
    fontFamily: '/path/to/font.ttf',
    textColor: 'white',
    backgroundColor: 'black@0.7',
    outlineColor: 'black',
    outlineWidth: 3,
    lineHeight: 1.2,
    maxWidth: 900,
    text: 'Hello world! This is a test caption.',
  };

  return createFFmpegCommand(
    '/path/to/input.mp4',
    '/path/to/output.mp4',
    exampleOptions
  );
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
  } = options;

  // Vypočítáme pozici pro víceřádkový text
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

  // Sestavíme text s novými řádky
  const multilineText = lines.join('\\n');

  const parameters: Record<string, string | number> = {
    text: `'${multilineText.replace(/'/g, "\\'")}'`,
    fontfile: `'${fontFamily}'`,
    fontsize: fontSize,
    fontcolor: textColor,
    x: '(w-text_w)/2',
    y: y,
    box: backgroundColor ? 1 : 0,
    boxcolor: backgroundColor || 'black@0.0',
    boxborderw: 5,
    borderw: outlineWidth,
    bordercolor: outlineColor || 'black',
    line_spacing: fontSize * (lineHeight - 1),
  };

  return {
    filter: 'drawtext',
    parameters,
  };
}
