/**
 * Konstanty pro subtitle styly a presety
 */

import type { SubtitleStyle, StylePreset } from '@/types/subtitles';

export const STYLE_PRESETS: Record<SubtitleStyle, StylePreset> = {
  BARBIE: {
    name: 'BARBIE',
    fontFamily: 'Poppins, Fredoka, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#8B5CF6',
    highlightHex: '#EC4899',
    emojiSet: ['💖', '✨', '💅'],
    animation: 'pop',
    fontSize: { mobile: 48, desktop: 64 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 3,
    shadow: { x: 0, y: 3, blur: 0, color: '#000000B3' }
  },
  BADDIE: {
    name: 'BADDIE',
    fontFamily: 'Anton, Archivo Black, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#111827',
    highlightHex: '#EF4444',
    emojiSet: ['🔥', '💋', '💣'],
    animation: 'glitch',
    fontSize: { mobile: 52, desktop: 68 },
    defaultPosition: 'BOTTOM',
    paddingPx: 18,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 4,
    shadow: { x: 0, y: 4, blur: 0, color: '#000000CC' }
  },
  INNOCENT: {
    name: 'INNOCENT',
    fontFamily: 'Fredoka, Comic Neue, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#1F2937',
    highlightHex: '#60A5FA',
    emojiSet: ['🌸', '💭', '😇'],
    animation: 'fade',
    fontSize: { mobile: 46, desktop: 62 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 2,
    shadow: { x: 0, y: 2, blur: 2, color: '#00000080' }
  },
  FUNNY: {
    name: 'FUNNY',
    fontFamily: 'Fredoka, Comic Neue, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#1F2937',
    highlightHex: '#FACC15',
    emojiSet: ['😂', '🤣', '🙃'],
    animation: 'bounce',
    fontSize: { mobile: 50, desktop: 66 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 3,
    shadow: { x: 0, y: 3, blur: 0, color: '#000000B3' }
  },
  GLAMOUR: {
    name: 'GLAMOUR',
    fontFamily: 'DM Sans, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#1F2937',
    highlightHex: '#F472B6',
    emojiSet: ['💎', '✨', '👠'],
    animation: 'fade',
    fontSize: { mobile: 48, desktop: 64 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 3,
    shadow: { x: 0, y: 3, blur: 0, color: '#000000B3' }
  },
  EDGY: {
    name: 'EDGY',
    fontFamily: 'Montserrat, Archivo Black, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#111827',
    highlightHex: '#34D399',
    emojiSet: ['⚡', '🖤', '🗡️'],
    animation: 'glitch',
    fontSize: { mobile: 50, desktop: 66 },
    defaultPosition: 'BOTTOM',
    paddingPx: 18,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 4,
    shadow: { x: 0, y: 4, blur: 0, color: '#000000CC' }
  },
  RAGE: {
    name: 'RAGE',
    fontFamily: 'Anton, Archivo Black, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#000000',
    highlightHex: '#FF0000',
    emojiSet: ['🔥', '💢', '💀'],
    animation: 'glitch',
    fontSize: { mobile: 54, desktop: 70 },
    defaultPosition: 'BOTTOM',
    paddingPx: 20,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 5,
    shadow: { x: 0, y: 5, blur: 0, color: '#000000FF' }
  },
  MEME: {
    name: 'MEME',
    fontFamily: 'Fredoka, Comic Neue, Inter, system-ui, sans-serif',
    primaryHex: '#FFFF00',
    secondaryHex: '#000000',
    highlightHex: '#00FF00',
    emojiSet: ['😂', '🤣', '👌'],
    animation: 'bounce',
    fontSize: { mobile: 48, desktop: 64 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 4,
    shadow: { x: 0, y: 4, blur: 0, color: '#000000CC' }
  },
  STREAMER: {
    name: 'STREAMER',
    fontFamily: 'Roboto, Inter, system-ui, sans-serif',
    primaryHex: '#FFFFFF',
    secondaryHex: '#1E1E1E',
    highlightHex: '#9146FF',
    emojiSet: ['🎮', '🎧', '📺'],
    animation: 'fade',
    fontSize: { mobile: 48, desktop: 64 },
    defaultPosition: 'BOTTOM',
    paddingPx: 16,
    safeAreaPx: { top: 120, bottom: 220 },
    strokePx: 3,
    shadow: { x: 0, y: 3, blur: 0, color: '#000000B3' }
  }
};

// Pomocné funkce pro práci se styly
export function getStylePreset(style: SubtitleStyle): StylePreset {
  return STYLE_PRESETS[style];
}

export function getAllStyleNames(): SubtitleStyle[] {
  return Object.keys(STYLE_PRESETS) as SubtitleStyle[];
}

export function getStyleDisplayName(style: SubtitleStyle): string {
  const preset = STYLE_PRESETS[style];
  return preset.name.charAt(0) + preset.name.slice(1).toLowerCase();
}

// CSS třídy pro animace
export const ANIMATION_CLASSES: Record<StylePreset['animation'], string> = {
  fade: 'animate-fade-in',
  bounce: 'animate-bounce-in',
  pop: 'animate-scale-in',
  glitch: 'animate-glitch'
};

// Utility pro generování CSS custom properties
export function getStyleCSSVars(style: SubtitleStyle): Record<string, string> {
  const preset = STYLE_PRESETS[style];
  return {
    '--subtitle-font-family': preset.fontFamily,
    '--subtitle-primary-color': preset.primaryHex,
    '--subtitle-secondary-color': preset.secondaryHex,
    '--subtitle-highlight-color': preset.highlightHex,
    '--subtitle-stroke-px': String(preset.strokePx ?? 0),
    '--subtitle-shadow-color': preset.shadow?.color ?? '#00000080',
    '--subtitle-shadow-x': String(preset.shadow?.x ?? 0),
    '--subtitle-shadow-y': String(preset.shadow?.y ?? 0),
    '--subtitle-shadow-blur': String(preset.shadow?.blur ?? 0),
  };
}
