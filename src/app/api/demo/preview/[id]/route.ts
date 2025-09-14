import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // For demo preview, return a placeholder video response
    return new NextResponse('Demo preview content', {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="preview-${id}.mp4"`,
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
