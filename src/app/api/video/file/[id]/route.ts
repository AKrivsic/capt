/**
 * GET /api/video/file/:id
 * Vrací download link pro video soubor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { FileDownloadResponse, ApiErrorResponse } from '@/types/api';
import { getStorage } from '@/lib/storage/r2';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<FileDownloadResponse | ApiErrorResponse>> {
  try {
    // Ověření autentizace
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const fileId = params.id;

    // Najdi uživatele
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Najdi video soubor
    const videoFile = await prisma.videoFile.findFirst({
      where: {
        id: fileId,
        userId: user.id
      }
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: 'File Not Found', message: 'File not found' },
        { status: 404 }
      );
    }

    // Vygeneruj presigned download URL (24 hodin)
    const storage = getStorage();
    const downloadUrl = await storage.getPresignedDownloadUrl(videoFile.storageKey, 86400); // 24 hodin
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hodin

    const response: FileDownloadResponse = {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileName: videoFile.originalName,
      fileSizeBytes: videoFile.fileSizeBytes || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get file download error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// Funkce je nyní implementována v R2 storage
