import { renderSubtitledVideo } from '@/subtitles/renderSubtitledVideo';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';
import { WhisperProvider } from '@/lib/transcription/whisper';
import { transcriptToChunks } from '@/queue/utils/transcriptUtils';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';

export async function processSubtitleJob(
  { jobId, fileId, style }: { jobId: string; fileId: string; style: string },
  onProgress: (p: number) => Promise<any>
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
  const chunks = transcriptToChunks(transcript);
  
  const renderResult = await renderSubtitledVideo({
    videoPath: inputPath,
    outPath,
    mode: 'TALKING_HEAD',
    style: style as any,
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

  // Cleanup temp files
  try {
    unlinkSync(inputPath);
    unlinkSync(outPath);
  } catch (err) {
    console.warn('Failed to cleanup temp files:', err);
  }

  return resultStorageKey;
}
