/**
 * FFmpeg subtitle renderer implementation (stub pro MVP)
 */

import type { 
  SubtitleRenderer, 
  RenderOptions, 
  RenderProgressCallback
} from './renderer';
import { RenderError } from './renderer';
import type { RenderInput, RenderResult } from '@/types/subtitles';
// import { STYLE_PRESETS } from '@/constants/subtitleStyles'; // Not used in current implementation
import { renderSubtitledVideo } from '@/subtitles/renderSubtitledVideo';

export class FFmpegRenderer implements SubtitleRenderer {
  private tempDir: string;
  private ffmpegPath: string;

  constructor(options?: { tempDir?: string; ffmpegPath?: string }) {
    this.tempDir = options?.tempDir || '/tmp';
    this.ffmpegPath = options?.ffmpegPath || 'ffmpeg';
  }

  async render(
    input: RenderInput,
    _options: RenderOptions = {}, // eslint-disable-line @typescript-eslint/no-unused-vars
    onProgress?: RenderProgressCallback
  ): Promise<RenderResult> {
    try {
      onProgress?.({ phase: 'transcribing', progress: 10 });

      // Use drawtext rendering (ASS branch disabled)
      const result = await renderSubtitledVideo({
        videoPath: input.videoPath,
        outPath: input.outPath,
        mode: input.mode,
        style: input.style.name, // Extract style name from StylePreset
        transcript: input.chunks, // TODO: Convert chunks to proper transcript format
        position: input.position
      });

      if (!result.success) {
        throw new Error(result.error || 'Rendering failed');
      }

      onProgress?.({ phase: 'rendering', progress: 50 });

      // Simulace renderování
      await new Promise(resolve => setTimeout(resolve, 5000));

      onProgress?.({ phase: 'uploading', progress: 90 });

      // TODO: Implement actual FFmpeg rendering
      throw new Error('FFmpeg rendering not implemented - requires actual video processing');

    } catch (error) {
      throw new RenderError(
        'Failed to render subtitles',
        'RENDER_FAILED',
        { originalError: error }
      );
    }
  }

  getSupportedFormats(): string[] {
    return ['mp4', 'mov', 'webm', 'avi'];
  }

  estimateRenderTime(durationSec: number, options: RenderOptions = {}): number {
    // Odhad: 2x doba videa pro rendering
    const baseTime = durationSec * 2;
    
    // Úprava podle kvality
    const qualityMultiplier = {
      low: 1,
      medium: 1.5,
      high: 2.5
    }[options.quality || 'medium'];

    return Math.ceil(baseTime * qualityMultiplier);
  }

  /**
   * Privátní metody pro implementaci
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async downloadFromStorage(_storageKey: string): Promise<string> {
    // TODO: Implementovat download a uložení do temp souboru
    throw new Error('Not implemented');
  }

  private generateSubtitleFile(input: RenderInput): string {
    // TODO: Vygenerovat ASS soubor s timestampy a styly
    const stylePreset = input.style;
    
    // ASS format pro pokročilé styling
    const assContent = [
      '[Script Info]',
      'Title: Generated Subtitles',
      'ScriptType: v4.00+',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
      `Style: Default,${stylePreset.fontFamily},36,${stylePreset.primaryHex},${stylePreset.secondaryHex},${stylePreset.highlightHex},&H00000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,30,1`,
      '',
      '[Events]',
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      // TODO: Convert chunks to proper transcript format
      'Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,Sample subtitle text'
    ].join('\n');

    return assContent;
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  private async executeFFmpeg(
    _inputPath: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _subtitlePath: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _outputPath: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _options: RenderOptions // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<void> {
    // TODO: Spustit FFmpeg s parametry pro vypalování titulků
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async uploadToStorage(_filePath: string): Promise<string> {
    // TODO: Nahrát výsledný soubor do S3/R2
    throw new Error('Not implemented');
  }
}
