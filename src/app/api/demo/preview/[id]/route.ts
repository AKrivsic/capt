import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find video file in database
    const videoFile = await prisma.videoFile.findFirst({
      where: { id },
      select: { storageKey: true, originalName: true }
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Demo video not found' },
        { status: 404 }
      );
    }

    // Get video from storage
    const storage = getStorage();
    const videoBuffer = await storage.downloadFile(videoFile.storageKey);
    
    return new NextResponse(videoBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${videoFile.originalName}"`,
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch (error) {
    console.error('Demo preview error:', error);
    return NextResponse.json(
      { error: 'Demo preview not found' },
      { status: 404 }
    );
  }
}
