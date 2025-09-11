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
    const { videoFileId, style, durationSec } = body;
    
    if (!videoFileId || !style || !durationSec) {
      return Response.json({ 
        ok: false, 
        error: 'Missing required fields: videoFileId, style, durationSec' 
      }, { status: 400 });
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      return Response.json({ 
        ok: false, 
        error: 'Authentication required for video generation' 
      }, { status: 401 });
    }

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
