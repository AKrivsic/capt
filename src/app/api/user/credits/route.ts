/**
 * GET /api/user/credits
 * Vrací aktuální stav kreditů uživatele
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

interface CreditsResponse {
  credits: number;
  userId: string;
}

interface ApiErrorResponse {
  error: string;
  message?: string;
}

export async function GET(): Promise<NextResponse<CreditsResponse | ApiErrorResponse>> {
  try {
    // Ověření autentizace
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Najdi uživatele
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, videoCredits: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    const response: CreditsResponse = {
      credits: user.videoCredits,
      userId: user.id
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}
