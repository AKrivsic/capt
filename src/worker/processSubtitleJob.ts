import { prisma } from '../lib/prisma';
import { getStorage } from '../lib/storage/r2';
import { execFfmpeg, escapeDrawtextText, ensureTmp, FFMPEG_FONTFILE } from '../subtitles/ffmpeg-utils';
import { transcribeVideo } from '../lib/transcription/whisper';
import fs from 'fs';

export interface SubtitleJobData {
  jobId: string;
  fileId: string;
  style: string;
}

export interface SubtitleJobResult {
  success: boolean;
  resultKey?: string;
  error?: string;
  transcript?: {
    words: Array<{ word: string; start: number; end: number }>;
    language: string;
    confidence: number;
  };
  subtitles?: Array<{ start: number; end: number; text: string }>;
}

export async function processSubtitleJob(data: SubtitleJobData): Promise<SubtitleJobResult> {
  const { jobId, fileId, style } = data;
  
  try {
    console.log(`[WORKER] Starting subtitle job ${jobId} for file ${fileId} with style ${style}`);
    
    // Update job status to processing
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { 
        status: 'PROCESSING',
        progress: 10
      }
    });
    
    // Get video file info
    const videoFile = await prisma.videoFile.findUnique({
      where: { id: fileId }
    });
    
    if (!videoFile) {
      throw new Error(`VIDEO_FILE_NOT_FOUND: ${fileId}`);
    }
    
    console.log(`[WORKER] Processing video: ${videoFile.storageKey}`);
    
    // Download video from R2
    const storage = getStorage();
    const videoBuffer = await storage.downloadFile(videoFile.storageKey);
    
    // Create temporary files
    const inputPath = `/tmp/${jobId}-input.mp4`;
    const outputPath = `/tmp/${jobId}-output.mp4`;
    
    ensureTmp(inputPath);
    await fs.promises.writeFile(inputPath, videoBuffer);
    
    console.log(`[WORKER] Video downloaded, starting transcription`);
    
    // Update progress
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { progress: 20 }
    });
    
    // Transcribe video with Whisper
    let transcript;
    try {
      transcript = await transcribeVideo(videoBuffer);
      console.log(`[WORKER] Transcription completed: ${transcript.words?.length || 0} words`);
    } catch (error) {
      console.error(`[WORKER] Transcription failed:`, error);
      throw new Error(`TRANSCRIPTION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Update progress
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { progress: 50 }
    });
    
    // Generate subtitles based on style
    const subtitles = generateSubtitles(transcript);
    console.log(`[WORKER] Generated ${subtitles.length} subtitle segments`);
    
    // Update progress
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { progress: 70 }
    });
    
    // Render video with subtitles
    const subtitleText = subtitles.map(s => s.text).join(' ');
    const escapedText = escapeDrawtextText(subtitleText);
    
    const videoFilter = `drawtext=fontfile='${FFMPEG_FONTFILE}':text='${escapedText}':fontsize=48:fontcolor=#FFFFFF:x=(w-text_w)/2:y=h-180:box=1:boxcolor=#1E1E1ECC:boxborderw=5:borderw=3:bordercolor=#9146FF:line_spacing=10:alpha='if(lt(t,0.25), t/0.25, 1)'`;
    
    console.log(`[WORKER] Rendering video with subtitles`);
    
    await execFfmpeg([
      '-y',
      '-i', inputPath,
      '-vf', videoFilter,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputPath,
    ]);
    
    console.log(`[WORKER] Video rendering completed`);
    
    // Update progress
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { progress: 90 }
    });
    
    // Upload result to R2
    const outputBuffer = await fs.promises.readFile(outputPath);
    const resultKey = `rendered/${jobId}-${Date.now()}.mp4`;
    
    await storage.uploadFile(resultKey, outputBuffer, 'video/mp4');
    console.log(`[WORKER] Result uploaded to R2: ${resultKey}`);
    
    // Update job status to completed
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        progress: 100,
        resultStorageKey: resultKey,
        completedAt: new Date()
      }
    });
    
    // Cleanup temporary files
    try {
      await fs.promises.unlink(inputPath);
      await fs.promises.unlink(outputPath);
    } catch (error) {
      console.warn(`[WORKER] Failed to cleanup temp files:`, error);
    }
    
    console.log(`[WORKER] Job ${jobId} completed successfully`);
    
    return {
      success: true,
      resultKey,
      transcript,
      subtitles
    };
    
  } catch (error) {
    console.error(`[WORKER] Job ${jobId} failed:`, error);
    
    // Update job status to failed
    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { 
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateSubtitles(transcript: { words: Array<{ word: string; start: number; end: number }> }): Array<{ start: number; end: number; text: string }> {
  // Simple subtitle generation based on transcript words
  // This is a basic implementation - can be enhanced with style-specific logic
  
  if (!transcript.words || transcript.words.length === 0) {
    return [
      { start: 0, end: 3, text: 'No transcript available' }
    ];
  }
  
  const subtitles: Array<{ start: number; end: number; text: string }> = [];
  const wordsPerSubtitle = 8; // Adjust based on style
  const maxDuration = 4; // seconds
  
  for (let i = 0; i < transcript.words.length; i += wordsPerSubtitle) {
    const words = transcript.words.slice(i, i + wordsPerSubtitle);
    const start = words[0]?.start || 0;
    const end = Math.min(words[words.length - 1]?.end || start + maxDuration, start + maxDuration);
    const text = words.map((w) => w.word).join(' ');
    
    subtitles.push({ start, end, text });
  }
  
  return subtitles;
}
