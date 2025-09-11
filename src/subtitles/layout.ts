import { MODE_PRESETS } from './modes';
import type { LayoutInput, SubtitleMode, VideoMeta, StylePreset } from './types';

export function computeY(input: LayoutInput): number {
  const { video: { height: H }, position, avoidOverlays, mode, linesCount, lineHeightPx } = input;
  const preset = MODE_PRESETS[mode];
  const safeTop = Math.round(H * preset.safeTopCoeff);
  const extraBottom = avoidOverlays ? 0.02 : 0; // 2 % navíc
  const safeBottom = Math.round(H * (preset.safeBottomCoeff + extraBottom));
  const blockHeight = Math.round(lineHeightPx * linesCount);

  if (position === 'TOP') return safeTop;
  if (position === 'BOTTOM') return H - safeBottom - blockHeight;
  // MIDDLE
  return Math.round(H / 2 - blockHeight / 2);
}

export function computeFontSizePx(video: VideoMeta, mode: SubtitleMode): number {
  const preset = MODE_PRESETS[mode];
  return Math.round(video.height * preset.fontSizeFromHeightCoeff);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function computeLineHeightPx(fontSizePx: number, style: StylePreset): number {
  // Approximate 1.2x line-height if not explicitly part of style
  return Math.round(fontSizePx * 1.2);
}



