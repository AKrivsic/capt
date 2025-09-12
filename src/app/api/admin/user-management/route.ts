/**
 * Admin User Management API
 * PUT: Update user plan and credits
 * POST: Add credits to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { z } from 'zod';
import { assertSameOrigin } from '@/lib/origin';
import { Prisma, SkuCode } from '@prisma/client';

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
  credits: z.number().int().min(1).max(1000), // Max 1000 kreditů najednou
});

// PUT - Update user plan and credits
export async function PUT(req: NextRequest) {
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

    // Log admin action
    console.log(`Admin updated user ${userId}: plan=${plan}, credits=${videoCredits}`);

    return NextResponse.json({ 
      ok: true, 
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    
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

  // Jen pro adminy
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
          sku: 'ADMIN_CREDITS' as SkuCode, // Special SKU pro admin akce
          creditsDelta: credits,
          amountUsd: 0, // Admin akce jsou zdarma
          stripePaymentIntentId: `admin_${Date.now()}_${userId}`,
        },
      });

      return updatedUser;
    });

    // Log admin action
    console.log(`Admin added ${credits} credits to user ${userId}`);

    return NextResponse.json({ 
      ok: true, 
      user: result,
      message: `Added ${credits} credits successfully`
    });

  } catch (error) {
    console.error('Add credits error:', error);
    
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
