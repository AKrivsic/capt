/**
 * GET /api/demo/preview/:id
 * Vrací presigned URL pro náhled demo video souboru
 * Demo soubory nemají uživatele (userId = null) a jsou přístupné bez autentizace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { FileDownloadResponse, ApiErrorResponse } from '@/types/api';
import { getStorage } from '@/lib/storage/r2';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<FileDownloadResponse | ApiErrorResponse>> {
  try {
    const params = await context.params;
    const fileId = params.id;

    // Najdi demo video soubor (userId = null)
    const videoFile = await prisma.videoFile.findFirst({
      where: {
        id: fileId,
        userId: null // Demo soubory mají userId = null
      }
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: 'File Not Found', message: 'Demo video not found' },
        { status: 404 }
      );
    }

    // Vygeneruj presigned download URL pro náhled (1 hodina)
    const storage = getStorage();
    const downloadUrl = await storage.getPresignedDownloadUrl(videoFile.storageKey, 3600); // 1 hodina
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    const response: FileDownloadResponse = {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileName: videoFile.originalName,
      fileSizeBytes: videoFile.fileSizeBytes || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get demo preview error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}
