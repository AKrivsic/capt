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

export async function POST(request: NextRequest): Promise<NextResponse<UploadInitResponse | ApiErrorResponse>> {
  try {
    // Ověření autentizace (volitelné pro demo)
    const session = await getServerSession();
    const isDemo = !session?.user?.email;

    // Validace input dat
    const body = await request.json();
    const validationResult = UploadInitRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Invalid request data',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { fileName, fileSize, mimeType } = validationResult.data;

    // Kontrola podporovaných formátů
    const supportedTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported Format', message: 'Unsupported video format' },
        { status: 400 }
      );
    }

    // Kontrola velikosti souboru (max 4MB pro Vercel Free)
    const maxSizeBytes = 4 * 1024 * 1024; // 4MB
    if (fileSize > maxSizeBytes) {
      return NextResponse.json(
        { error: 'File Too Large', message: 'File is too large (max 4MB)' },
        { status: 400 }
      );
    }

    // Pro demo nebo autentifikované uživatele
    let userId: string;
    let storageKey: string;
    let videoFile: any;

    if (isDemo) {
      // Demo upload - použij anonymní ID
      userId = 'demo';
      storageKey = `demo/videos/${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;
      
      // Pro demo nevytváříme záznam v databázi
      videoFile = { id: `demo-${Date.now()}` };
    } else {
      // Autentifikovaný upload
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

      // Kontrola kreditů
      if (user.videoCredits <= 0) {
        return NextResponse.json(
          { error: 'Insufficient Credits', message: 'Insufficient credits' },
          { status: 402 }
        );
      }

      userId = user.id;
      storageKey = `videos/${user.id}/${Date.now()}-${fileName}`;
      
      videoFile = await prisma.videoFile.create({
        data: {
          userId: user.id,
          storageKey,
          originalName: fileName,
          fileSizeBytes: fileSize,
          mimeType,
        }
      });
    }

    // Vygeneruj presigned upload URL pro R2
    const storage = getStorage();
    const uploadUrl = await storage.getPresignedUploadUrl(storageKey, 3600); // 1 hodina
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    const response: UploadInitResponse = {
      uploadUrl,
      fileId: videoFile.id,
      expiresAt: expiresAt.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload init error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// TODO: Implementovat presigned URL generování
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generatePresignedUploadUrl(storageKey: string): Promise<{ url: string; expiresAt: Date }> {
  // Pro S3:
  // const s3 = new AWS.S3();
  // const params = {
  //   Bucket: process.env.S3_BUCKET,
  //   Key: storageKey,
  //   Expires: 3600, // 1 hodina
  //   ContentType: mimeType
  // };
  // const url = s3.getSignedUrl('putObject', params);
  
  // Pro R2 (Cloudflare):
  // Similar S3-compatible API
  
  throw new Error('Not implemented - presigned URL generation');
}
