import { NextRequest, NextResponse } from 'next/server';
import type { Readable } from 'node:stream';
import { S3Client, GetObjectCommand, type GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';
import { contentDispositionInline } from '@/utils/http/contentDisposition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isNodeReadable(x: unknown): x is Readable {
  return !!x && typeof (x as Readable).pipe === 'function';
}

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

function parseContentRange(rangeHeader: string): { start: number; end: number; total: number } | null {
  const m = /^bytes\s+(\d+)-(\d+)\/(\d+)$/.exec(rangeHeader);
  if (!m) return null;
  return { start: Number(m[1]), end: Number(m[2]), total: Number(m[3]) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find video file in database (demo soubory mají userId: null)
    const videoFile = await prisma.videoFile.findFirst({
      where: { 
        id,
        userId: null // Demo soubory nemají uživatele
      },
      select: { storageKey: true, originalName: true }
    });

    if (!videoFile) {
      console.log(`Demo preview 404: VideoFile not found for ID ${id}`);
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if file exists in storage
    const storage = getStorage();
    const fileExists = await storage.fileExists?.(videoFile.storageKey);
    
    if (!fileExists) {
      console.log(`Demo preview 404: File not found in storage for ID ${id}, storageKey: ${videoFile.storageKey}`);
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prefer streaming directly from R2 (AWS SDK v3). Fallback to buffered download if S3 is not configured.
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucketName = process.env.R2_BUCKET_NAME || 'captioni-videos';

    const rangeHeader = request.headers.get('range');

    if (accessKeyId && secretAccessKey && endpoint) {
      const s3 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });

      const getParams: ConstructorParameters<typeof GetObjectCommand>[0] = {
        Bucket: bucketName,
        Key: videoFile.storageKey,
      };
      if (rangeHeader) {
        getParams.Range = rangeHeader;
      }

      const out: GetObjectCommandOutput = await s3.send(new GetObjectCommand(getParams));

      // Prepare headers
      const headers = new Headers();
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Type', out.ContentType || 'video/mp4');
      headers.set('Cache-Control', 'public, max-age=1800');
      if (videoFile.originalName) {
        headers.set('Content-Disposition', contentDispositionInline(videoFile.originalName));
      }

      let status = 200;
      if (rangeHeader) {
        const cr = out.ContentRange;
        if (!cr) {
          return new Response(JSON.stringify({ ok: false, error: 'RANGE_MISSING' }), { status: 416 });
        }
        const parsed = parseContentRange(cr);
        if (!parsed) {
          return new Response(JSON.stringify({ ok: false, error: 'RANGE_PARSE' }), { status: 416 });
        }
        const { start, end, total } = parsed;
        headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
        headers.set('Content-Length', String(end - start + 1));
        status = 206;
      } else {
        const total = Number(out.ContentLength ?? 0);
        if (total > 0) headers.set('Content-Length', String(total));
        status = 200;
      }

      const body = out.Body;
      if (!body) {
        console.log(`Demo preview 404: R2 Body empty for key ${videoFile.storageKey}`);
        return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
      }

      // Prefer Web ReadableStream if available
      type HasTransform = { transformToWebStream: () => ReadableStream<Uint8Array> };
      if ((body as unknown as HasTransform) && typeof (body as unknown as HasTransform).transformToWebStream === 'function') {
        const webStream = (body as unknown as HasTransform).transformToWebStream();
        return new Response(webStream, { status, headers });
      }

      // Fallback: Node.js Readable
      if (isNodeReadable(body)) {
        const chunks: Buffer[] = [];
        for await (const chunk of body) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
        }
        const buf = Buffer.concat(chunks);
        const ab = bufferToArrayBuffer(buf);
        return new Response(ab, { status, headers });
      }

      // As a last resort, attempt to stringify
      return new Response(JSON.stringify({ ok: false, error: 'UNSUPPORTED_BODY' }), { status: 500, headers });
    }

    // Fallback path (no S3 configured): use existing buffered storage implementation
    const videoBuffer = await storage.downloadFile(videoFile.storageKey);
    const fileSize = videoBuffer.length;

    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!rangeMatch) {
        return new Response(null, { status: 416 });
      }
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize || start > end) {
        return new Response(null, { status: 416 });
      }

      const chunkSize = end - start + 1;
      const chunk = videoBuffer.slice(start, end + 1);

      const headers = new Headers();
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', chunkSize.toString());
      headers.set('Content-Type', 'video/mp4');
      headers.set('Cache-Control', 'public, max-age=1800');
      if (videoFile.originalName) {
        headers.set('Content-Disposition', contentDispositionInline(videoFile.originalName));
      }

      return new Response(bufferToArrayBuffer(chunk), { status: 206, headers });
    } else {
      const headers = new Headers();
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', fileSize.toString());
      headers.set('Content-Type', 'video/mp4');
      headers.set('Cache-Control', 'public, max-age=1800');
      if (videoFile.originalName) {
        headers.set('Content-Disposition', contentDispositionInline(videoFile.originalName));
      }

      return new Response(bufferToArrayBuffer(videoBuffer), { status: 200, headers });
    }
  } catch (error) {
    console.error('Demo preview error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL' },
      { status: 500 }
    );
  }
}
