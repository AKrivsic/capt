// import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLimits } from '@/lib/limits';
import { PLAN_LIMITS } from '@/constants/plans';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const userLimits = await getUserLimits(session.user.id, (await import('@/lib/prisma')).prisma);
    
    if (!userLimits) {
      return Response.json({ 
        ok: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const planLimits = PLAN_LIMITS[userLimits.plan];

    return Response.json({
      ok: true,
      textLimits: {
        generationsLeft: userLimits.textGenerationsLeft,
        generationsUsed: userLimits.textGenerationsUsed,
        plan: userLimits.plan
      },
      videoLimits: {
        maxDuration: planLimits.maxVideoDuration,
        maxVideosPerMonth: planLimits.maxVideosPerMonth,
        videosUsedThisMonth: userLimits.videosUsedThisMonth,
        remaining: planLimits.maxVideosPerMonth === -1 ? -1 : Math.max(0, planLimits.maxVideosPerMonth - userLimits.videosUsedThisMonth),
        plan: userLimits.plan
      }
    });

  } catch (error) {
    console.error('Error fetching user limits:', error);
    return Response.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}