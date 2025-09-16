import { renderSubtitledVideo } from '@/subtitles/renderSubtitledVideo';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';
import { WhisperProvider } from '@/lib/transcription/whisper';
// import { transcriptToChunks } from '@/queue/utils/transcriptUtils';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';

/**
 * Video subtitle processing workflow
 * 
 * Complete pipeline for processing video files and generating subtitles:
 * 1. Fetch job and video file info from database
 * 2. Download original video from R2 storage
 * 3. Transcribe audio using OpenAI Whisper
 * 4. Render subtitles using FFmpeg with specified style
 * 5. Upload final video with subtitles to R2
 * 6. Clean up temporary files
 * 
 * @param jobId - SubtitleJob ID from database
 * @param fileId - VideoFile ID (unused but kept for compatibility)
 * @param style - Subtitle style (BARBIE, BADDIE, etc.)
 * @param onProgress - Progress callback function (0-100)
 * @returns Storage key of the final rendered video
 */
export async function processSubtitleJob(
  { jobId, style }: { jobId: string; fileId: string; style: string },
  onProgress: (p: number) => Promise<void>
) {
  // 1) dotáhni video info z DB (cesty, storageKey)
  const job = await prisma.subtitleJob.findUnique({ 
    where: { id: jobId }, 
    include: { videoFile: true } 
  });
  if (!job?.videoFile?.storageKey) throw new Error('Video storageKey missing');

  // 2) stáhni originální video do temp (worker FS)
  const storage = getStorage();
  const videoBuffer = await storage.downloadFile(job.videoFile.storageKey);
  const inputPath = `/tmp/${jobId}-input.mp4`;
  writeFileSync(inputPath, videoBuffer);
  await onProgress(20);

  // 3) transkripce (Whisper)
  const whisperProvider = new WhisperProvider();
  const transcript = await whisperProvider.transcribe(
    { 
      storageKey: job.videoFile.storageKey, 
      audioLanguage: 'auto' 
    },
    (p) => onProgress(20 + Math.floor(30 * p.progress / 100))  // 20→50
  );
  await onProgress(55);

  // 4) render (drawtext pipeline)
  const outPath = `/tmp/${jobId}-output.mp4`;
  // const chunks = transcriptToChunks(transcript); // Currently unused but may be needed for future features
  
  const renderResult = await renderSubtitledVideo({
    videoPath: inputPath,
    outPath,
    mode: 'TALKING_HEAD',
    style: style as 'BARBIE' | 'BADDIE' | 'INNOCENT' | 'FUNNY' | 'GLAMOUR' | 'EDGY' | 'RAGE' | 'MEME' | 'STREAMER',
    transcript: transcript,
    position: 'BOTTOM'
  });
  
  if (!renderResult.success) {
    throw new Error(renderResult.error || 'Rendering failed');
  }
  
  await onProgress(90);

  // 5) upload výsledku
  const outputBuffer = readFileSync(outPath);
  const resultStorageKey = `rendered/${jobId}-${Date.now()}.mp4`;
  await storage.uploadFile(resultStorageKey, outputBuffer, 'video/mp4');
  await onProgress(100);

  // Cleanup temp files with better error handling
  const cleanupFiles = [inputPath, outPath];
  for (const filePath of cleanupFiles) {
    try {
      if (fs.existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (err) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, err);
    }
  }

  return resultStorageKey;
}
