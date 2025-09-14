import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getUserLimits,
  checkVideoDurationLimit,
  checkVideoGenerationLimit,
  recordVideoUsage,
} from '@/lib/limits';
import type { SubtitleStyle } from '@/types/subtitles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateBody = {
  videoFileId: string;
  style: SubtitleStyle | string;
  durationSec: number;
  isDemo?: boolean;
};

// ---- Storage helpers (type-guardy nad unionem MockR2Storage | R2Storage) ----
function hasGetPublicUrl(
  s: unknown
): s is { getPublicUrl: (key: string) => Promise<string> | string } {
  return !!s && typeof s === 'object' && typeof (s as Record<string, unknown>).getPublicUrl === 'function';
}

function hasGetSignedDownloadUrl(
  s: unknown
): s is { getSignedDownloadUrl: (key: string, ttlSeconds?: number) => Promise<string> } {
  return !!s && typeof s === 'object' && typeof (s as Record<string, unknown>).getSignedDownloadUrl === 'function';
}

function hasGetFileUrl(
  s: unknown
): s is { getFileUrl: (key: string) => string } {
  return !!s && typeof s === 'object' && typeof (s as Record<string, unknown>).getFileUrl === 'function';
}

// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Parse request body
    const body: GenerateBody = await req.json();
    const { videoFileId, style, durationSec, isDemo } = body;

    if (!videoFileId || !style || !durationSec) {
      return Response.json(
        { ok: false, error: 'Missing required fields: videoFileId, style, durationSec' },
        { status: 400 }
      );
    }

    // Demo mode check
    const isDemoMode = isDemo === true || !session?.user?.id;

    if (isDemoMode) {
      // Demo video limits: 1 video/month, max 15s
      if (durationSec > 15) {
        return Response.json(
          { ok: false, error: 'Demo videos are limited to 15 seconds' },
          { status: 400 }
        );
      }
      // TODO: Check demo video usage (1/month)
    } else {
      // Authenticated user processing
      if (!session?.user?.id) {
        return Response.json(
          { ok: false, error: 'Authentication required for video generation' },
          { status: 401 }
        );
      }
    }

    if (isDemoMode) {
      // Demo processing - real transcription and rendering
      const demoJobId = `demo-${Date.now()}`;

      try {
        // 1) Storage
        const { getStorage } = await import('@/lib/storage/r2');
        const storage = getStorage();
        const storageKey = `demo/videos/${videoFileId}`;

        // 2) Transcribe
        const { WhisperProvider } = await import('@/lib/transcription/whisper');
        const whisper = new WhisperProvider();
        const transcript = await whisper.transcribe({
          storageKey,
          audioLanguage: 'auto',
        });

        // 3) Render
        const { renderSubtitledVideo } = await import('@/subtitles/renderSubtitledVideo');
        const outputKey = `demo/processed/${demoJobId}.mp4`;
        const outputPath = `/tmp/demo-${demoJobId}.mp4`;
        const resolvedStyle = style as SubtitleStyle;

        const renderResult = await renderSubtitledVideo({
          videoPath: storageKey, // stáhne se ze storage
          outPath: outputPath,
          mode: 'TALKING_HEAD',
          style: resolvedStyle,
          transcript,
          position: 'BOTTOM',
        });

        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Rendering failed');
        }

        // 4) Upload zpět do storage
        const processedVideoBuffer = await import('fs').then((fs) => fs.readFileSync(outputPath));
        await storage.uploadFile(outputKey, processedVideoBuffer, 'video/mp4');

        // 5) Úklid tmp souboru
        await import('fs').then((fs) => fs.unlinkSync(outputPath));

        // 6) Seskupení slov do krátkých vět (subtitles)
        const groupedSubtitles: Array<{ start: number; end: number; text: string }> = [];
        let currentSentence = '';
        let currentStart = 0;
        let currentEnd = 0;

        for (const word of transcript.words) {
          if (currentSentence === '') {
            currentStart = word.start;
          }
          currentSentence += (currentSentence ? ' ' : '') + word.text;
          currentEnd = word.end;

          if (/[.!?]$/.test(word.text) || currentSentence.split(' ').length >= 4) {
            groupedSubtitles.push({
              start: currentStart,
              end: currentEnd,
              text: currentSentence.trim(),
            });
            currentSentence = '';
          }
        }
        if (currentSentence) {
          groupedSubtitles.push({
            start: currentStart,
            end: currentEnd,
            text: currentSentence.trim(),
          });
        }

        // 7) Získání přehratelné URL — bezpečně napříč storage implementacemi
        let processedVideoUrl: string;
        if (hasGetPublicUrl(storage)) {
          const url = await storage.getPublicUrl(outputKey);
          processedVideoUrl = typeof url === 'string' ? url : String(url);
        } else if (hasGetFileUrl(storage)) {
          processedVideoUrl = storage.getFileUrl(outputKey);
        } else if (hasGetSignedDownloadUrl(storage)) {
          processedVideoUrl = await storage.getSignedDownloadUrl(outputKey, 3600); // 1 hod
        } else {
          processedVideoUrl = `/r2/${outputKey}`; // nouzový fallback
        }

        return Response.json({
          ok: true,
          jobId: demoJobId,
          status: 'COMPLETED',
          message: 'Demo video processing completed',
          isDemo: true,
          result: {
            processedVideoUrl,
            subtitles: groupedSubtitles,
            rawTranscript: transcript,
            style: resolvedStyle,
            duration: durationSec,
            language: transcript.language,
            confidence: transcript.confidence,
          },
        });
      } catch (error) {
        console.error('Demo video processing error:', error);

        // Fallback (mock)
        const mockProcessedUrl = `https://demo-processed.captioni.com/${demoJobId}.mp4`;
        return Response.json({
          ok: true,
          jobId: demoJobId,
          status: 'COMPLETED',
          message: 'Demo video processing completed (fallback)',
          isDemo: true,
          result: {
            processedVideoUrl: mockProcessedUrl,
            subtitles: [
              { start: 0, end: 3, text: 'Welcome to Captioni demo!' },
              { start: 3, end: 6, text: 'This is how AI subtitles work.' },
              { start: 6, end: 9, text: 'Upload your video to try it!' },
            ],
            style,
            duration: durationSec,
            language: 'en',
            confidence: 0.8,
            fallback: true,
          },
        });
      }
    }

    // ---- Authenticated user flow ----
    const userLimits = await getUserLimits(session!.user.id, prisma);
    if (!userLimits) {
      return Response.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const durationCheck = checkVideoDurationLimit(durationSec, userLimits.plan);
    if (!durationCheck.allowed) {
      return Response.json({ ok: false, error: durationCheck.reason }, { status: 400 });
    }

    const generationCheck = checkVideoGenerationLimit(userLimits);
    if (!generationCheck.allowed) {
      return Response.json({
        ok: true,
        error: generationCheck.reason,
        limitReached: generationCheck.limitReached,
        message: 'Video generation completed, but you have reached your monthly limit',
      });
    }

    // Verify file ownership
    const videoFile = await prisma.videoFile.findFirst({
      where: { id: videoFileId, userId: session!.user.id },
    });

    if (!videoFile) {
      return Response.json(
        { ok: false, error: 'Video file not found or access denied' },
        { status: 404 }
      );
    }

    // Create job record
    const subtitleJob = await prisma.subtitleJob.create({
      data: {
        userId: session!.user.id,
        videoFileId,
        style: style as SubtitleStyle,
        status: 'QUEUED',
      },
    });

    await recordVideoUsage(session!.user.id, ip, durationSec, prisma);

    // TODO: enqueue job (Whisper + FFmpeg) do workeru
    return Response.json({
      ok: true,
      jobId: subtitleJob.id,
      status: 'QUEUED',
      message: 'Video processing started',
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
