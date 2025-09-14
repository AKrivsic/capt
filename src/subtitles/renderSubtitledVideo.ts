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
    primaryHex: (picked.primaryHex || base.primaryHex) as `#${string}`,
    secondaryHex: (picked.secondaryHex || base.secondaryHex) as `#${string}`,
    highlightHex: (picked.highlightHex || base.highlightHex) as `#${string}`,
    emojiSet: picked.emojiSet?.length ? picked.emojiSet : (base.emojiSet || []),
    animation: picked.animation || base.animation || 'fade',
    fontSize: picked.fontSize ?? base.fontSize,
    defaultPosition: picked.defaultPosition || base.defaultPosition || 'BOTTOM',
    paddingPx: picked.paddingPx ?? base.paddingPx,
    safeAreaPx: picked.safeAreaPx ?? base.safeAreaPx,
    strokePx: picked.strokePx ?? base.strokePx,
    shadow: picked.shadow ?? base.shadow,
  };
}

/** Helpers pro rozřešení responsivních hodnot (mobile/desktop) */
type ResponsiveNumber = number | { mobile: number; desktop: number };

function isResponsiveNumber(v: unknown): v is { mobile: number; desktop: number } {
  return !!v && typeof v === 'object' && 'mobile' in v && 'desktop' in v;
}

function resolveResponsiveNumber(value: ResponsiveNumber | undefined, isMobile: boolean, fallback: number): number {
  if (value == null) return fallback;
  if (typeof value === 'number') return value;
  if (isResponsiveNumber(value)) return isMobile ? value.mobile : value.desktop;
  return fallback;
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
        shadow: appliedStyle.shadow,
      },
    });

    // Implement actual FFmpeg drawtext rendering
    const { createFFmpegCommand } = await import('@/lib/ffmpeg/captionRenderer');

    // Výstupní plátno – aktuálně napevno vertikální 1080x1920
    const videoWidth = 1080;
    const videoHeight = 1920;
    const isPortrait = videoHeight >= videoWidth;

    // Bezpečně vyřešíme fontSize z union typu (číslo / {mobile, desktop})
    const fontSizePx = resolveResponsiveNumber(appliedStyle.fontSize as ResponsiveNumber | undefined, isPortrait, 48);

    // Create FFmpeg command for subtitle rendering
    const ffmpegCommand = createFFmpegCommand(
      input.videoPath,
      input.outPath,
      {
        videoWidth,
        videoHeight,
        position: input.position || 'BOTTOM',
        avoidOverlays: true,
        fontSize: fontSizePx,
        fontFamily: appliedStyle.fontFamily || 'Arial',
        textColor: appliedStyle.primaryHex || '#FFFFFF',
        backgroundColor: appliedStyle.secondaryHex ? `${appliedStyle.secondaryHex}CC` : 'rgba(0,0,0,0.7)',
        outlineColor: appliedStyle.highlightHex || '#000000',
        outlineWidth: appliedStyle.strokePx ?? 3,
        lineHeight: 1.2,
        maxWidth: 900,
        text: 'Sample subtitle', // TODO: nahradit skutečným transcript textem
        animation: appliedStyle.animation || 'fade',
      }
    );

    // Execute FFmpeg command with ffmpeg-static
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Get ffmpeg path from ffmpeg-static
    const ffmpegPath = (await import('ffmpeg-static')).default || 'ffmpeg';
    const finalCommand = ffmpegCommand.replace(/^ffmpeg\b/, ffmpegPath);

    try {
      await execAsync(finalCommand);
      console.log('FFmpeg rendering completed successfully');

      return {
        success: true,
        outputPath: input.outPath,
      };
    } catch (error) {
      console.error('FFmpeg rendering failed:', error);
      return {
        success: false,
        error: `FFmpeg rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

  } catch (error) {
    console.error('Rendering failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
