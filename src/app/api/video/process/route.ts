/**
 * POST /api/video/process
 * Spustí zpracování videa a vytvoření titulků
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProcessRequestSchema } from '@/types/api';
import type { ProcessResponse, ApiErrorResponse } from '@/types/api';
import { jobTracking } from '@/lib/tracking';

export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse | ApiErrorResponse>> {
  try {
    // Orchestration via n8n webhook (BullMQ deprecated)

    // Ověření autentizace (volitelné pro demo)
    const session = await getServerSession(authOptions);
    const isDemo = !session?.user?.email;

    // Validace input dat
    const requestBody = await request.json();
    const validationResult = ProcessRequestSchema.safeParse(requestBody);
    
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

    const { fileId, style } = validationResult.data;

    let userId: string;
    if (isDemo) {
      // Demo processing - vytvoř nebo najdi demo uživatele
      const demoUser = await prisma.user.upsert({
        where: { id: 'demo-user-12345' },
        update: {},
        create: {
          id: 'demo-user-12345',
          email: 'demo@captioni.com',
          name: 'Demo User',
          plan: 'FREE',
          videoCredits: 999999, // Unlimited for demo
          marketingConsent: false,
          marketingConsentAt: new Date()
        }
      });
      userId = demoUser.id;
    } else {
      // Najdi uživatele
      const user = await prisma.user.findUnique({
        where: { email: session!.user!.email as string },
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
    }

    // Najdi video soubor
    const videoFile = await prisma.videoFile.findFirst({
      where: {
        id: fileId,
        userId: isDemo ? null : userId // Demo soubory mají userId = null
      }
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video Not Found', message: 'Video soubor nenalezen' },
        { status: 404 }
      );
    }

    // Kontrola, zda už neexistuje aktivní job pro tento soubor
    const existingJob = await prisma.subtitleJob.findFirst({
      where: {
        videoFileId: fileId,
        status: { in: ['QUEUED', 'PROCESSING'] }
      }
    });

    if (existingJob) {
      // Idempotent response: return existing jobId instead of 409
      const response: ProcessResponse = { jobId: existingJob.id };
      return NextResponse.json(response);
    }

    // Transakce: vytvoř job a odečti kredity (pouze pro autentifikované uživatele)
    const result = await prisma.$transaction(async (tx) => {
      // Vytvoř subtitle job
      const job = await tx.subtitleJob.create({
        data: {
          userId: userId, // Vždy máme userId (demo nebo real)
          videoFileId: fileId,
          style,
          status: 'QUEUED',
          progress: 0
        }
      });

      // Odečti kredit pouze pro autentifikované uživatele
      if (!isDemo) {
        await tx.user.update({
          where: { id: userId },
          data: { videoCredits: { decrement: 1 } }
        });
      }

      return job;
    });

    // Trackování
    jobTracking.started({ jobId: result.id, style });

    // Spusť orchestraci přes n8n webhook
    console.log(`Starting subtitle job ${result.id} for video ${fileId} with style ${style}`);

    type StartJobPayload = {
      jobId: string;
      fileId: string;
      style: string;
    };

    type N8nOkResponse = {
      ok: boolean;
      received?: unknown;
    };

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      // ponecháme job v QUEUED, FE bude dál pollovat; vrátíme 503 pro jasnou signalizaci
      await prisma.subtitleJob.update({
        where: { id: result.id },
        data: {
          errorMessage: 'N8N_WEBHOOK_URL is not set',
        },
      });
      return NextResponse.json(
        { error: 'Service Unavailable', message: 'N8N webhook is not configured' },
        { status: 503 }
      );
    }

    const webhookPayload: StartJobPayload = { jobId: result.id, fileId, style };

    const headers = new Headers({ 'content-type': 'application/json' });
    const authUser = process.env.N8N_BASIC_USER;
    const authPass = process.env.N8N_BASIC_PASS;
    if (authUser && authPass) {
      const token = Buffer.from(`${authUser}:${authPass}`).toString('base64');
      headers.set('authorization', `Basic ${token}`);
    }

    // Retry with timeout/backoff (idempotent webhook expected)
    async function postWithTimeout(url: string, init: RequestInit & { timeoutMs: number }): Promise<Response> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), init.timeoutMs);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    }

    const maxAttempts = 3;
    const baseDelayMs = 500;
    let attempt = 0;
    let accepted = false;
    let lastError: string | undefined;

    while (attempt < maxAttempts && !accepted) {
      try {
        const resp = await postWithTimeout(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
          timeoutMs: 5000,
        });
        if (resp.ok) {
          // Optional validation
          try {
            const json = (await resp.json()) as N8nOkResponse;
            if (json && typeof json.ok === 'boolean' && json.ok === false) {
              lastError = 'n8n response not ok';
            } else {
              accepted = true;
            }
          } catch {
            // Non-JSON OK response - považujme za accepted
            accepted = true;
          }
        } else {
          lastError = `n8n webhook ${resp.status}: ${await resp.text()}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'request failed';
      }

      if (!accepted) {
        attempt += 1;
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(3, attempt - 1);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    if (!accepted) {
      // ponecháme job v QUEUED; FE bude pollovat a retry řešíme mimo (cron/n8n)
      await prisma.subtitleJob.update({
        where: { id: result.id },
        data: { errorMessage: lastError ?? 'webhook trigger failed' },
      });
      // neblokujeme klienta – vracíme jobId, zůstane v QUEUED
    }

    const response: ProcessResponse = {
      jobId: result.id
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Process video error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// API enqueue-only - no FFmpeg/Whisper processing in API routes
