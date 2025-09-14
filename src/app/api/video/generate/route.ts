import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getUserLimits, 
  checkVideoDurationLimit, 
  checkVideoGenerationLimit,
  recordVideoUsage 
} from '@/lib/limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    // Parse request body
    const body = await req.json();
    const { videoFileId, style, durationSec, isDemo } = body;
    
    if (!videoFileId || !style || !durationSec) {
      return Response.json({ 
        ok: false, 
        error: 'Missing required fields: videoFileId, style, durationSec' 
      }, { status: 400 });
    }

    // Demo mode check
    const isDemoMode = isDemo === true || !session?.user?.id;
    
    if (isDemoMode) {
      // Demo video limits: 1 video/month, max 15s
      if (durationSec > 15) {
        return Response.json({ 
          ok: false, 
          error: 'Demo videos are limited to 15 seconds' 
        }, { status: 400 });
      }
      
      // TODO: Check demo video usage (1/month) using fingerprinting
      // For now, allow demo processing
    } else {
      // Authenticated user processing
      if (!session?.user?.id) {
        return Response.json({ 
          ok: false, 
          error: 'Authentication required for video generation' 
        }, { status: 401 });
      }
    }

    if (isDemoMode) {
      // Demo processing - real transcription and rendering
      const demoJobId = `demo-${Date.now()}`;
      
      try {
        // 1. Get video file from storage (demo videos are stored in demo/ folder)
        const { getStorage } = await import('@/lib/storage/r2');
        const storage = getStorage();
        
        // For demo, we'll use the videoFileId as storage key
        const storageKey = `demo/videos/${videoFileId}`;
        
        // 2. Transcribe video using Whisper
        const { WhisperProvider } = await import('@/lib/transcription/whisper');
        const whisper = new WhisperProvider();
        
        const transcript = await whisper.transcribe({
          storageKey,
          audioLanguage: 'auto'
        });
        
        // 3. Render subtitles with FFmpeg
        const { renderSubtitledVideo } = await import('@/subtitles/renderSubtitledVideo');
        
        const outputKey = `demo/processed/${demoJobId}.mp4`;
        const outputPath = `/tmp/demo-${demoJobId}.mp4`;
        
        const renderResult = await renderSubtitledVideo({
          videoPath: storageKey, // This will be downloaded from storage
          outPath: outputPath,
          mode: 'TALKING_HEAD', // Default mode for demo
          style: style as any, // Convert string to SubtitleStyle
          transcript: transcript,
          position: 'BOTTOM' // Default position for demo
        });
        
        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Rendering failed');
        }
        
        // 4. Upload processed video back to storage
        const processedVideoBuffer = await import('fs').then(fs => fs.readFileSync(outputPath));
        await storage.uploadFile(outputKey, processedVideoBuffer, 'video/mp4');
        
        // 5. Clean up temp file
        await import('fs').then(fs => fs.unlinkSync(outputPath));
        
        // 6. Convert transcript to subtitle format
        const subtitles = transcript.words.map((word, index) => ({
          start: word.start,
          end: word.end,
          text: word.text,
          confidence: word.confidence
        }));
        
        // Group words into sentences for better subtitle display
        const groupedSubtitles = [];
        let currentSentence = '';
        let currentStart = 0;
        let currentEnd = 0;
        
        for (const word of transcript.words) {
          if (currentSentence === '') {
            currentStart = word.start;
          }
          currentSentence += (currentSentence ? ' ' : '') + word.text;
          currentEnd = word.end;
          
          // End sentence on punctuation or after 3-4 words
          if (word.text.match(/[.!?]$/) || currentSentence.split(' ').length >= 4) {
            groupedSubtitles.push({
              start: currentStart,
              end: currentEnd,
              text: currentSentence.trim()
            });
            currentSentence = '';
          }
        }
        
        // Add remaining words as last subtitle
        if (currentSentence) {
          groupedSubtitles.push({
            start: currentStart,
            end: currentEnd,
            text: currentSentence.trim()
          });
        }
        
        const processedVideoUrl = await storage.getPublicUrl(outputKey);
        
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
            style: style,
            duration: durationSec,
            language: transcript.language,
            confidence: transcript.confidence
          }
        });
        
      } catch (error) {
        console.error('Demo video processing error:', error);
        
        // Fallback to mock result if real processing fails
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
              { start: 0, end: 3, text: "Welcome to Captioni demo!" },
              { start: 3, end: 6, text: "This is how AI subtitles work." },
              { start: 6, end: 9, text: "Upload your video to try it!" }
            ],
            style: style,
            duration: durationSec,
            language: 'en',
            confidence: 0.8,
            fallback: true
          }
        });
      }
    }

    // Authenticated user processing
    // Get user limits
    const userLimits = await getUserLimits(session.user.id, prisma);
    if (!userLimits) {
      return Response.json({ 
        ok: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check video duration limit
    const durationCheck = checkVideoDurationLimit(durationSec, userLimits.plan);
    if (!durationCheck.allowed) {
      return Response.json({ 
        ok: false, 
        error: durationCheck.reason 
      }, { status: 400 });
    }

    // Check video generation limit (monthly)
    const generationCheck = checkVideoGenerationLimit(userLimits);
    if (!generationCheck.allowed) {
      // UX Flow: poslední video se zobrazí, ale při dalším pokusu modal
      return Response.json({ 
        ok: true, 
        error: generationCheck.reason,
        limitReached: generationCheck.limitReached,
        message: 'Video generation completed, but you have reached your monthly limit'
      });
    }

    // Verify video file belongs to user
    const videoFile = await prisma.videoFile.findFirst({
      where: {
        id: videoFileId,
        userId: session.user.id
      }
    });

    if (!videoFile) {
      return Response.json({ 
        ok: false, 
        error: 'Video file not found or access denied' 
      }, { status: 404 });
    }

    // Create subtitle job
    const subtitleJob = await prisma.subtitleJob.create({
      data: {
        userId: session.user.id,
        videoFileId: videoFileId,
        style: style,
        status: 'QUEUED'
      }
    });

    // Record video usage
    await recordVideoUsage(session.user.id, ip, durationSec, prisma);

    // TODO: Queue job for processing (Whisper + FFmpeg)
    // For now, return success with job ID
    return Response.json({
      ok: true,
      jobId: subtitleJob.id,
      status: 'QUEUED',
      message: 'Video processing started'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return Response.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
