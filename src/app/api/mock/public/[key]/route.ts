import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // For mock, return a placeholder response
    console.log(`Mock public file request for key: ${key}`);
    return new NextResponse('Mock public file content', {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Mock public file error:', error);
    return NextResponse.json(
      { error: 'Mock public file not found' },
      { status: 404 }
    );
  }
}
