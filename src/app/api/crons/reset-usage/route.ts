import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Verify this is a cron job (Vercel Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Reset text generations for all users (monthly reset)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all users with their plan limits
    const users = await prisma.user.findMany({
      select: {
        id: true,
        plan: true,
        textGenerationsLeft: true,
        textGenerationsUsed: true
      }
    });

    const { PLAN_LIMITS } = await import('@/constants/plans');

    let resetCount = 0;
    for (const user of users) {
      const planLimits = PLAN_LIMITS[user.plan];
      
      // Reset text generations based on plan
      if (planLimits.text !== -1) { // Not unlimited
        await prisma.user.update({
          where: { id: user.id },
          data: {
            textGenerationsLeft: planLimits.text,
            textGenerationsUsed: 0
          }
        });
        resetCount++;
      }
    }

    // Clean up old video usage records (keep last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const deletedUsage = await prisma.videoUsage.deleteMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo
        }
      }
    });

    return Response.json({
      ok: true,
      message: 'Usage limits reset successfully',
      stats: {
        usersReset: resetCount,
        oldUsageRecordsDeleted: deletedUsage.count
      }
    });

  } catch (error) {
    console.error('Error resetting usage limits:', error);
    return Response.json({ 
      ok: false, 
      error: 'Failed to reset usage limits' 
    }, { status: 500 });
  }
}

