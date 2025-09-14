import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // For mock, return a placeholder response
    return new NextResponse('Mock file content', {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${key}"`,
      },
    });
  } catch (error) {
    console.error('Mock download error:', error);
    return NextResponse.json(
      { error: 'Mock file not found' },
      { status: 404 }
    );
  }
}
