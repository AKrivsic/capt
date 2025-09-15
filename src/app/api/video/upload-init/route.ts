/**
 * POST /api/video/upload-init
 * Vytvoří presigned upload URL pro video soubor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { UploadInitRequestSchema } from '@/types/api';
import type { UploadInitResponse, ApiErrorResponse } from '@/types/api';
import { getStorage } from '@/lib/storage/r2';

type SupportedMime =
  | 'video/mp4'
  | 'video/mov'
  | 'video/quicktime'
  | 'video/webm';

interface VideoFileRef {
  id: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadInitResponse | ApiErrorResponse>> {
  try {
    // Ověření autentizace (volitelné pro demo)
    const session = await getServerSession();
    const isDemo = !session?.user?.email;

    // Validace input dat
    const bodyUnknown: unknown = await request.json();
    const validationResult = UploadInitRequestSchema.safeParse(bodyUnknown);

    if (!validationResult.success) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fileName, fileSize, mimeType } = validationResult.data;

    // Kontrola podporovaných formátů
    const supportedTypes: ReadonlyArray<SupportedMime> = [
      'video/mp4',
      'video/mov',
      'video/quicktime',
      'video/webm',
    ];
    if (!supportedTypes.includes(mimeType as SupportedMime)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unsupported Format', message: 'Unsupported video format' },
        { status: 400 }
      );
    }

    // Kontrola velikosti souboru (max 4MB pro Vercel Free)
    const maxSizeBytes = 4 * 1024 * 1024; // 4MB
    if (fileSize > maxSizeBytes) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'File Too Large', message: 'File is too large (max 4MB)' },
        { status: 400 }
      );
    }

    // Příprava klíčů + záznamu o videu
    let storageKey: string;
    let videoFile: VideoFileRef;

    if (isDemo) {
      // Demo upload - použij anonymní ID
      storageKey = `demo/videos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${fileName}`;

      // Pro demo vytvoříme záznam v databázi s null userId (demo soubory)
      const created = await prisma.videoFile.create({
        data: {
          userId: null, // Demo soubory nemají uživatele
          storageKey,
          originalName: fileName,
          fileSizeBytes: fileSize,
          mimeType,
        },
        select: { id: true },
      });
      videoFile = created;
    } else {
      // Autentifikovaný upload
      const user = await prisma.user.findUnique({
        where: { email: session!.user!.email as string },
        select: { id: true, videoCredits: true },
      });

      if (!user) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'User Not Found', message: 'User not found' },
          { status: 404 }
        );
      }

      // Kontrola kreditů
      if (user.videoCredits <= 0) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'Insufficient Credits', message: 'Insufficient credits' },
          { status: 402 }
        );
      }

      storageKey = `videos/${user.id}/${Date.now()}-${fileName}`;

      // Vraťme jen {id} pro přesný typ
      const created = await prisma.videoFile.create({
        data: {
          userId: user.id,
          storageKey,
          originalName: fileName,
          fileSizeBytes: fileSize,
          mimeType,
        },
        select: { id: true },
      });
      videoFile = created;
    }

    // Vygeneruj presigned upload URL pro R2
    const storage = getStorage();
    const uploadUrl: string = await storage.getPresignedUploadUrl(
      storageKey,
      mimeType,
      3600
    ); // 1 hodina
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    const response: UploadInitResponse = {
      uploadUrl,
      fileId: videoFile.id,
      expiresAt: expiresAt.toISOString(),
    };

    return NextResponse.json<UploadInitResponse>(response);
  } catch (error) {
    console.error('Upload init error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}
