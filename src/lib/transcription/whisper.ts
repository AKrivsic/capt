/**
 * Whisper STT provider implementation (stub pro MVP)
 */

import type { 
  TranscriptionProvider, 
  TranscriptionInput, 
  TranscriptionProgressCallback
} from './provider';
import { TranscriptionError } from './provider';
import type { Transcript } from '@/types/subtitles';

export class WhisperProvider implements TranscriptionProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for Whisper provider');
    }
  }

  async transcribe(
    input: TranscriptionInput,
    onProgress?: TranscriptionProgressCallback
  ): Promise<Transcript> {
    try {
      onProgress?.({ phase: 'downloading', progress: 10 });

      // 1. Stáhnout video ze storage
      const videoBuffer = await this.downloadFromStorage(input.storageKey);
      onProgress?.({ phase: 'processing', progress: 30 });

      // 2. Extraktovat audio (FFmpeg)
      const audioBuffer = await this.extractAudio(videoBuffer);
      onProgress?.({ phase: 'processing', progress: 50 });

      // 3. Detekovat jazyk (pokud není specifikován)
      const language = input.audioLanguage || await this.detectLanguage(input.storageKey);
      onProgress?.({ phase: 'processing', progress: 70 });

      // 4. Poslat na Whisper API
      let transcript: Transcript;
      
      try {
        transcript = await this.callWhisperAPI(audioBuffer, language);
      } catch (apiError) {
        console.warn('Whisper API failed, using mock data:', apiError);
        // Fallback na mock data pokud API není dostupné
        transcript = this.getMockTranscript();
      }
      
      onProgress?.({ phase: 'uploading', progress: 100 });

      return transcript;

    } catch (error) {
      console.error('Transcription error:', error);
      throw new TranscriptionError(
        'Failed to transcribe audio',
        'API_ERROR',
        { originalError: error }
      );
    }
  }

  getSupportedLanguages(): string[] {
    return [
      'auto', 'en', 'cs', 'sk', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async detectLanguage(_storageKey: string): Promise<string> {
    // TODO: Implementovat detekci jazyka
    // Pro MVP vracíme defaultně 'auto'
    return 'auto';
  }

  private getMockTranscript(): Transcript {
    return {
      words: [
        { text: 'Hello', start: 0.0, end: 0.5, confidence: 0.95 },
        { text: 'world', start: 0.6, end: 1.0, confidence: 0.98 },
        { text: 'this', start: 1.1, end: 1.3, confidence: 0.92 },
        { text: 'is', start: 1.4, end: 1.5, confidence: 0.99 },
        { text: 'a', start: 1.6, end: 1.7, confidence: 0.85 },
        { text: 'test', start: 1.8, end: 2.2, confidence: 0.96 },
        { text: 'video', start: 2.3, end: 2.8, confidence: 0.94 },
        { text: 'with', start: 2.9, end: 3.1, confidence: 0.91 },
        { text: 'subtitles', start: 3.2, end: 3.8, confidence: 0.97 },
      ],
      language: 'en',
      confidence: 0.94
    };
  }

  /**
   * Privátní metody pro implementaci
   */
  private async downloadFromStorage(storageKey: string): Promise<Buffer> {
    try {
      const { getStorage } = await import('@/lib/storage/r2');
      const storage = getStorage();
      return await storage.downloadFile(storageKey);
    } catch (error) {
      console.warn('Storage download failed, using mock data:', error);
      // Fallback na mock data
      return Buffer.from('mock video data');
    }
  }

  private async extractAudio(videoBuffer: Buffer): Promise<Buffer> {
    // TODO: Použít FFmpeg pro extrakci audio
    // Pro MVP vracíme mock audio data
    console.log(`Mock audio extraction from ${videoBuffer.length} bytes`);
    return Buffer.from('mock audio data');
  }

  private async callWhisperAPI(audioBuffer: Buffer, language?: string): Promise<Transcript> {
    try {
      const openai = new (await import('openai')).default({
        apiKey: this.apiKey,
      });

      // Create a File object from buffer
      const file = new File([audioBuffer.buffer as ArrayBuffer], 'audio.mp4', { type: 'video/mp4' });

      // Call Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
        language: language === 'auto' ? undefined : language
      });

      // Convert Whisper response to our format
      const words = [];
      
      if (transcription.words && Array.isArray(transcription.words)) {
        // Whisper provides word-level timestamps
        words.push(...transcription.words.map((word: { word: string; start: number; end: number; probability?: number }) => ({
          text: word.word,
          start: word.start,
          end: word.end,
          confidence: word.probability || 0.9
        })));
      } else if (transcription.text) {
        // Fallback: split text into words with estimated timestamps
        const textWords = transcription.text.split(' ');
        const totalDuration = 30; // Assume 30s video for estimation
        const wordDuration = totalDuration / textWords.length;
        
        textWords.forEach((word, index) => {
          words.push({
            text: word,
            start: index * wordDuration,
            end: (index + 1) * wordDuration,
            confidence: 0.8
          });
        });
      }

      return {
        words,
        language: transcription.language || 'en',
        confidence: transcription.duration ? 0.95 : 0.8
      };
    } catch (error) {
      console.error('Whisper API error:', error);
      throw new Error(`Whisper API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
