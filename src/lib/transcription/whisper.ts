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
        console.error('Whisper API failed:', apiError);
        throw new TranscriptionError(
          'Whisper API is not available',
          'API_ERROR',
          { originalError: apiError }
        );
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


  /**
   * Privátní metody pro implementaci
   */
  private async downloadFromStorage(storageKey: string): Promise<Buffer> {
    try {
      const { getStorage } = await import('@/lib/storage/r2');
      const storage = getStorage();
      return await storage.downloadFile(storageKey);
    } catch (error) {
      console.error('Storage download failed:', error);
      throw new Error(`Failed to download video from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractAudio(videoBuffer: Buffer): Promise<Buffer> {
    try {
      // Use FFmpeg to extract audio from video
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Get ffmpeg path from ffmpeg-static
      const ffmpegPath = (await import('ffmpeg-static')).default || 'ffmpeg';
      
      // Write video buffer to temp file
      const fs = await import('fs');
      const path = await import('path');
      const tempVideoPath = path.join('/tmp', `temp-video-${Date.now()}.mp4`);
      const tempAudioPath = path.join('/tmp', `temp-audio-${Date.now()}.wav`);
      
      fs.writeFileSync(tempVideoPath, videoBuffer);
      
      // Extract audio using FFmpeg with ffmpeg-static path
      const ffmpegCommand = `${ffmpegPath} -i "${tempVideoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${tempAudioPath}" -y`;
      await execAsync(ffmpegCommand);
      
      // Read audio file
      const audioBuffer = fs.readFileSync(tempAudioPath);
      
      // Clean up temp files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(tempAudioPath);
      
      console.log(`Audio extraction completed: ${audioBuffer.length} bytes`);
      return audioBuffer;
    } catch (error) {
      console.error('Audio extraction failed:', error);
      throw new Error(`Failed to extract audio from video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
