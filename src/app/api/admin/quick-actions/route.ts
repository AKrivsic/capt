/**
 * Admin Quick Actions API
 * POST: Bulk admin actions for testing and promotions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { z } from 'zod';
import { assertSameOrigin } from '@/lib/origin';

// Schema pro quick actions
const QuickActionSchema = z.object({
  action: z.enum([
    'add_credits_all',
    'upgrade_free_users',
    'downgrade_to_free',
    'reset_usage_all',
    'promo_credits',
    'cleanup_old_data',
    'create_test_user',
    'simulate_usage'
  ]),
  credits: z.number().int().min(1).max(1000).optional(),
  newPlan: z.enum(['FREE', 'STARTER', 'PRO', 'PREMIUM']).optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Same-origin guard (CSRF)
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  }

  // Jen pro adminy
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = QuickActionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, credits, newPlan, reason } = parsed.data;
    let result: Record<string, unknown> = {};

    switch (action) {
      case 'add_credits_all':
        result = await addCreditsToAll(credits!);
        break;
      
      case 'upgrade_free_users':
        result = await upgradeFreeUsers(newPlan!);
        break;
      
      case 'downgrade_to_free':
        result = await downgradeToFree();
        break;
      
      case 'reset_usage_all':
        result = await resetUsageAll();
        break;
      
      case 'promo_credits':
        result = await promoCredits(credits!, reason);
        break;
      
      case 'cleanup_old_data':
        result = await cleanupOldData();
        break;
      
      case 'create_test_user':
        result = await createTestUser();
        break;
      
      case 'simulate_usage':
        result = await simulateUsage();
        break;
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    console.log(`Admin quick action: ${action}`, result);

    return NextResponse.json({ 
      ok: true, 
      action,
      result,
      message: getSuccessMessage(action, result)
    });

  } catch (error) {
    console.error('Quick action error:', error);
    
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function addCreditsToAll(credits: number) {
  const result = await prisma.user.updateMany({
    data: {
      videoCredits: { increment: credits },
      updatedAt: new Date()
    }
  });

  // Log admin action
  await prisma.purchase.createMany({
    data: [{
      userId: 'admin_bulk_action',
      sku: 'ADMIN_CREDITS',
      creditsDelta: credits,
      amountUsd: 0,
      stripePaymentIntentId: `admin_bulk_${Date.now()}`,
    }]
  });

  return { affectedUsers: result.count, creditsAdded: credits };
}

async function upgradeFreeUsers(newPlan: string) {
  const result = await prisma.user.updateMany({
    where: { plan: 'FREE' },
    data: { 
      plan: newPlan as "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED",
      updatedAt: new Date()
    }
  });

  return { affectedUsers: result.count, newPlan };
}

async function downgradeToFree() {
  const result = await prisma.user.updateMany({
    data: { 
      plan: 'FREE',
      updatedAt: new Date()
    }
  });

  return { affectedUsers: result.count };
}

async function resetUsageAll() {
  // Reset usage counts (if you have usage tracking)
  // This is a placeholder - implement based on your usage tracking system
  return { message: 'Usage reset functionality not implemented yet' };
}

async function promoCredits(credits: number, reason?: string) {
  const result = await prisma.user.updateMany({
    data: {
      videoCredits: { increment: credits },
      updatedAt: new Date()
    }
  });

  // Log promo action
  await prisma.purchase.createMany({
    data: [{
      userId: 'admin_promo_action',
      sku: 'ADMIN_CREDITS',
      creditsDelta: credits,
      amountUsd: 0,
      stripePaymentIntentId: `admin_promo_${Date.now()}`,
    }]
  });

  return { affectedUsers: result.count, creditsAdded: credits, reason };
}

async function cleanupOldData() {
  // Cleanup old data (implement based on your needs)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Example: cleanup old video files
  const deletedFiles = await prisma.videoFile.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      subtitleJobs: { none: {} } // Only delete if no jobs exist
    }
  });

  return { deletedFiles: deletedFiles.count };
}

async function createTestUser() {
  const testUser = await prisma.user.create({
    data: {
      email: `test_${Date.now()}@example.com`,
      name: 'Test User',
      plan: 'FREE',
      videoCredits: 10,
    }
  });

  return { userId: testUser.id, email: testUser.email };
}

async function simulateUsage() {
  // Simulate some usage for testing
  const users = await prisma.user.findMany({ take: 5 });
  
  for (const user of users) {
    await prisma.videoFile.create({
      data: {
        userId: user.id,
        storageKey: `test_${Date.now()}_${user.id}`,
        originalName: 'test_video.mp4',
        durationSec: 30,
        fileSizeBytes: 1024000,
        mimeType: 'video/mp4',
      }
    });
  }

  return { simulatedFor: users.length };
}

function getSuccessMessage(action: string, result: Record<string, unknown>): string {
  switch (action) {
    case 'add_credits_all':
      return `Added ${result.creditsAdded} credits to ${result.affectedUsers} users`;
    case 'upgrade_free_users':
      return `Upgraded ${result.affectedUsers} users to ${result.newPlan}`;
    case 'downgrade_to_free':
      return `Downgraded ${result.affectedUsers} users to FREE`;
    case 'promo_credits':
      return `Promo: Added ${result.creditsAdded} credits to ${result.affectedUsers} users`;
    case 'create_test_user':
      return `Created test user: ${result.email}`;
    case 'simulate_usage':
      return `Simulated usage for ${result.simulatedFor} users`;
    case 'cleanup_old_data':
      return `Cleaned up ${result.deletedFiles} old files`;
    default:
      return 'Action completed successfully';
  }
}
