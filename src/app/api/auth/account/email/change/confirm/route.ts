import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeEmailChangeToken } from "@/lib/email/templates/emailChange";

export async function POST(req: NextRequest) {
  const { token } = (await req.json()) as { token?: string };
  if (!token) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });

  const consumed = await consumeEmailChangeToken(token);
  if (!consumed) return NextResponse.json({ ok: false, error: "invalid_or_expired" }, { status: 400 });

  const { userId, newEmail } = consumed;
  await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });

  return NextResponse.json({ ok: true });
}
