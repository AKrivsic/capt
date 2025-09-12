import type { Decorations, RenderInput, SubtitleChunk, StylePreset } from './types';

export function buildDecorations(
  chunks: SubtitleChunk[], // eslint-disable-line @typescript-eslint/no-unused-vars
  style: StylePreset, // eslint-disable-line @typescript-eslint/no-unused-vars
  _featureFlags: RenderInput['featureFlags'] // eslint-disable-line @typescript-eslint/no-unused-vars
): Decorations {
  // Minimal safe implementation: no extra tokens for now
  return { tokens: [] };
}
