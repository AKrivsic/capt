/**
 * Integration tests for /api/video/generate
 */

import { POST } from '@/app/api/video/generate/route';
import { NextRequest } from 'next/server';

// Mock FFmpeg execution
jest.mock('@/subtitles/ffmpeg-utils', () => ({
  escapeDrawtextText: jest.fn((text: string) => text.replace(/:/g, '\\:').replace(/'/g, "\\'")),
  ensureTmp: jest.fn(),
  execFfmpeg: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

// Mock R2 storage
jest.mock('@/lib/storage/r2', () => ({
  getStorage: jest.fn(() => ({
    downloadFile: jest.fn().mockResolvedValue(Buffer.from('mock video data')),
    uploadFile: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock file system
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      access: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('mock output data')),
    },
    existsSync: jest.fn().mockReturnValue(true),
    unlinkSync: jest.fn(),
  };
});

describe('/api/video/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle R2 key input successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        r2Key: 'uploads/test.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.storageKey).toBeDefined();
  });

  it('should handle demo file input successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        demoFile: 'demo.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.storageKey).toBeDefined();
  });

  it('should slugify demo file names', async () => {
    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        demoFile: 'test file with spaces & special chars!.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('should handle missing demo file', async () => {
    // Mock file system to return false for existsSync
    const fs = jest.requireMock('fs');
    fs.existsSync.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        demoFile: 'nonexistent.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('DEMO_FILE_NOT_FOUND');
  });

  it('should handle R2 download failure', async () => {
    const { getStorage } = jest.requireMock('@/lib/storage/r2');
    getStorage().downloadFile.mockRejectedValue(new Error('R2 download failed'));

    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        r2Key: 'uploads/test.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Failed to download from R2');
  });

  it('should handle FFmpeg execution failure', async () => {
    const { execFfmpeg } = jest.requireMock('@/subtitles/ffmpeg-utils');
    execFfmpeg.mockRejectedValue(new Error('FFmpeg failed'));

    const request = new NextRequest('http://localhost:3000/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({
        demoFile: 'demo.mp4',
        text: 'Hello world',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('FFmpeg failed');
  });
});
