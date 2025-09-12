import type { ModePreset, SubtitleMode } from '@/types/subtitles';

export const MODE_PRESETS: Record<SubtitleMode, ModePreset> = {
  TALKING_HEAD: {
    mode: 'TALKING_HEAD',
    maxCharsPerLine: 28, // mezi 24–32
    maxLines: 2,
    targetCPS: { min: 12, max: 18 },
    defaultPosition: 'BOTTOM',
    fontSizeFromHeightCoeff: 0.052, // ~5.2% H → 100 px na 1920
    safeTopCoeff: 0.10,
    safeBottomCoeff: 0.16,
    baseStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      primaryHex: '#FFFFFF',
      secondaryHex: '#111827',
      highlightHex: '#FFFFFF',
      emojiSet: [],
      animation: 'fade',
      fontSize: { mobile: 48, desktop: 64 },
      defaultPosition: 'BOTTOM',
      paddingPx: 16,
      safeAreaPx: { top: 120, bottom: 220 },
      strokePx: 3,
      shadow: { x: 0, y: 3, blur: 0, color: '#000000B3' }
    }
  },
  CINEMATIC_CLIP: {
    mode: 'CINEMATIC_CLIP',
    maxCharsPerLine: 36, // mezi 32–40
    maxLines: 2,
    targetCPS: { min: 10, max: 14 },
    defaultPosition: 'BOTTOM',
    fontSizeFromHeightCoeff: 0.042, // ~4.2% H → 80 px na 1920
    safeTopCoeff: 0.08,
    safeBottomCoeff: 0.14,
    baseStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      primaryHex: '#FFFFFF',
      secondaryHex: '#111827',
      highlightHex: '#FFFFFF',
      emojiSet: [],
      animation: 'fade',
      fontSize: { mobile: 44, desktop: 60 },
      defaultPosition: 'BOTTOM',
      paddingPx: 16,
      safeAreaPx: { top: 100, bottom: 200 },
      strokePx: 3,
      shadow: { x: 0, y: 2, blur: 0, color: '#00000099' }
    }
  },
};



