/**
 * Main subtitle rendering logic with drawtext
 */

import type { StylePreset, SubtitleStyle, SubtitleMode } from '@/types/subtitles';
import { STYLE_PRESETS } from '@/constants/subtitleStyles';
import { MODE_PRESETS } from './modes';

/**
 * Merge base style from mode preset with selected style preset
 */
export function mergeStyle(base: Omit<StylePreset, 'name'>, picked: StylePreset): StylePreset {
  return {
    name: picked.name,
    fontFamily: picked.fontFamily || base.fontFamily,
    primaryHex: picked.primaryHex || base.primaryHex as `#${string}`,
    secondaryHex: picked.secondaryHex || base.secondaryHex as `#${string}`,
    highlightHex: picked.highlightHex || base.highlightHex as `#${string}`,
    emojiSet: picked.emojiSet?.length ? picked.emojiSet : (base.emojiSet || []),
    animation: picked.animation || base.animation || 'fade',
    fontSize: picked.fontSize || base.fontSize,
    defaultPosition: picked.defaultPosition || base.defaultPosition || 'BOTTOM',
    paddingPx: picked.paddingPx ?? base.paddingPx,
    safeAreaPx: picked.safeAreaPx || base.safeAreaPx,
    strokePx: picked.strokePx ?? base.strokePx,
    shadow: picked.shadow ?? base.shadow
  };
}

/**
 * Main rendering function using drawtext (ASS branch disabled)
 */
export async function renderSubtitledVideo(
  input: {
    videoPath: string;
    outPath: string;
    mode: SubtitleMode;
    style: SubtitleStyle;
    transcript: unknown; // TODO: Use proper transcript type
    position?: 'TOP' | 'MIDDLE' | 'BOTTOM';
  }
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  try {
    // Get mode preset
    const modePreset = MODE_PRESETS[input.mode];
    if (!modePreset) {
      throw new Error(`Unknown mode: ${input.mode}`);
    }

    // Get selected style preset
    const selectedStyle = STYLE_PRESETS[input.style];
    if (!selectedStyle) {
      throw new Error(`Unknown style: ${input.style}`);
    }

    // Merge mode base style with selected style
    const appliedStyle = mergeStyle(modePreset.baseStyle, selectedStyle);

    console.log('Rendering with merged style:', {
      mode: input.mode,
      style: input.style,
      appliedStyle: {
        fontFamily: appliedStyle.fontFamily,
        animation: appliedStyle.animation,
        strokePx: appliedStyle.strokePx,
        shadow: appliedStyle.shadow
      }
    });

    // TODO: Implement actual FFmpeg drawtext rendering
    // For now, return mock success
    return {
      success: true,
      outputPath: input.outPath
    };

  } catch (error) {
    console.error('Rendering failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
