/**
 * Abstrakce pro subtitle rendering
 */

import type { RenderInput, RenderResult, RenderProgress } from '@/types/subtitles';

export interface RenderOptions {
  outputFormat?: 'mp4' | 'mov' | 'webm';
  quality?: 'low' | 'medium' | 'high';
  resolution?: '720p' | '1080p' | '4k';
  maxDurationSec?: number; // 60 pro MVP
}

export type RenderProgressCallback = (progress: RenderProgress) => void;

/**
 * Rozhraní pro subtitle renderery
 */
export interface SubtitleRenderer {
  /**
   * Renderuje video s vypálenými titulky
   */
  render(
    input: RenderInput,
    options?: RenderOptions,
    onProgress?: RenderProgressCallback
  ): Promise<RenderResult>;

  /**
   * Získá podporované formáty
   */
  getSupportedFormats(): string[];

  /**
   * Odhadne čas renderování
   */
  estimateRenderTime(durationSec: number, options?: RenderOptions): number;
}

/**
 * Error typy pro rendering
 */
export class RenderError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_INPUT' | 'UNSUPPORTED_FORMAT' | 'RENDER_FAILED' | 'UPLOAD_FAILED',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RenderError';
  }
}

/**
 * Factory pro vytváření renderů
 */
export class SubtitleRendererFactory {
  private static renderers = new Map<string, SubtitleRenderer>();

  static register(name: string, renderer: SubtitleRenderer): void {
    this.renderers.set(name, renderer);
  }

  static get(name: string): SubtitleRenderer {
    const renderer = this.renderers.get(name);
    if (!renderer) {
      throw new Error(`Subtitle renderer '${name}' not found`);
    }
    return renderer;
  }

  static getDefault(): SubtitleRenderer {
    // Pro MVP používáme FFmpeg renderer
    return this.get('ffmpeg');
  }
}
