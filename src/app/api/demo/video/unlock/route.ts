import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email as string | undefined;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    // TODO: Issue magic link (Resend/MailerLite), store token in DB, associate clean video URL

    return Response.json({ ok: true, message: 'Magic link sent' });
  } catch {
    return Response.json({ ok: false, error: 'Failed to process request' }, { status: 500 });
  }
}



