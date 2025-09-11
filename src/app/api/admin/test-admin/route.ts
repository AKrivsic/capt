/**
 * Test Admin API - Bypass admin authentication for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { assertSameOrigin } from '@/lib/origin';
import { Prisma } from '@prisma/client';

// Schema pro update uživatele
const UpdateUserSchema = z.object({
  userId: z.string().cuid(),
  plan: z.enum(['FREE', 'TEXT_STARTER', 'TEXT_PRO', 'VIDEO_LITE', 'VIDEO_PRO', 'VIDEO_UNLIMITED']),
  videoCredits: z.number().int().min(0),
});

// Schema pro přidání kreditů
const AddCreditsSchema = z.object({
  userId: z.string().cuid(),
  action: z.literal('add_credits'),
  credits: z.number().int().min(1).max(1000),
});

// PUT - Update user plan and credits
export async function PUT(req: NextRequest) {
  // Same-origin guard (CSRF)
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  }

  // ⚠️ BYPASS ADMIN AUTH FOR TESTING
  console.log('⚠️ Test admin API called - bypassing authentication');

  try {
    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, plan, videoCredits } = parsed.data;

    // Update uživatele
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        plan,
        videoCredits,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        videoCredits: true,
        updatedAt: true,
      },
    });

    console.log(`Test admin updated user ${userId}: plan=${plan}, credits=${videoCredits}`);

    return NextResponse.json({ 
      ok: true, 
      user: updatedUser,
      message: 'User updated successfully (TEST MODE)'
    });

  } catch (error) {
    console.error('Test admin update error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Add credits to user
export async function POST(req: NextRequest) {
  // Same-origin guard (CSRF)
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
  }

  // ⚠️ BYPASS ADMIN AUTH FOR TESTING
  console.log('⚠️ Test admin API called - bypassing authentication');

  try {
    const body = await req.json();
    const parsed = AddCreditsSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, credits } = parsed.data;

    // Transakce: přidej kredity a vytvoř záznam o admin akci
    const result = await prisma.$transaction(async (tx) => {
      // Update kreditů
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          videoCredits: { increment: credits },
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          videoCredits: true,
        },
      });

      // Vytvoř záznam o admin akci (pro audit trail)
      await tx.purchase.create({
        data: {
          userId,
          sku: 'ADMIN_CREDITS',
          creditsDelta: credits,
          amountUsd: 0,
          stripePaymentIntentId: `test_admin_${Date.now()}_${userId}`,
        },
      });

      return updatedUser;
    });

    console.log(`Test admin added ${credits} credits to user ${userId}`);

    return NextResponse.json({ 
      ok: true, 
      user: result,
      message: `Added ${credits} credits successfully (TEST MODE)`
    });

  } catch (error) {
    console.error('Test admin add credits error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
