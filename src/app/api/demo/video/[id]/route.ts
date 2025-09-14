import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // For demo, return a placeholder video response
    return new NextResponse('Demo video content', {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="demo-${id}.mp4"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Demo video error:', error);
    return NextResponse.json(
      { error: 'Demo video not found' },
      { status: 404 }
    );
  }
}
