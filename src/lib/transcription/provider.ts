/**
 * Abstrakce pro STT (Speech-to-Text) providery
 */

import type { Transcript } from '@/types/subtitles';

export interface TranscriptionInput {
  storageKey: string;
  audioLanguage?: string; // 'cs', 'en', 'auto'
  maxDurationSec?: number; // 60 pro MVP
}

export interface TranscriptionProgress {
  phase: 'downloading' | 'processing' | 'uploading';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // sekundy
}

export type TranscriptionProgressCallback = (progress: TranscriptionProgress) => void;

/**
 * Rozhraní pro STT providery (Whisper, AssemblyAI, atd.)
 */
export interface TranscriptionProvider {
  /**
   * Převede video na transkript s timestampy
   */
  transcribe(
    input: TranscriptionInput,
    onProgress?: TranscriptionProgressCallback
  ): Promise<Transcript>;

  /**
   * Získá podporované jazyky
   */
  getSupportedLanguages(): string[];

  /**
   * Detekuje jazyk ze zvuku (volitelné)
   */
  detectLanguage?(storageKey: string): Promise<string>;
}

/**
 * Error typy pro transcription
 */
export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: 'FILE_NOT_FOUND' | 'INVALID_FORMAT' | 'TOO_LONG' | 'QUOTA_EXCEEDED' | 'API_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Factory pro vytváření transcription providerů
 */
export class TranscriptionProviderFactory {
  private static providers = new Map<string, TranscriptionProvider>();

  static register(name: string, provider: TranscriptionProvider): void {
    this.providers.set(name, provider);
  }

  static get(name: string): TranscriptionProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Transcription provider '${name}' not found`);
    }
    return provider;
  }

  static getDefault(): TranscriptionProvider {
    // Pro MVP používáme Whisper (bude implementován později)
    return this.get('whisper');
  }
}
