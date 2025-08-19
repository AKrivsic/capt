import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueEmailChangeToken } from "@/lib/email/templates/emailChange";
import { sendEmailChangeVerify } from "@/lib/email/senders";

function baseUrl(req: NextRequest): string {
  const hdr = req.headers.get("x-forwarded-proto");
  const proto = hdr ?? "https";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { newEmail } = (await req.json()) as { newEmail?: string };
  if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const token = await issueEmailChangeToken(session.user.id, newEmail);
  const url = `${baseUrl(req)}/settings/email/confirm?token=${encodeURIComponent(token)}`;

  await sendEmailChangeVerify(newEmail, url, newEmail);
  return NextResponse.json({ ok: true });
}
