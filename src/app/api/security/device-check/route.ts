// src/app/api/security/device-check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewDeviceLogin } from "@/lib/email/senders";

function getClientIP(req: NextRequest): string | null {
  // Pořadí: X-Forwarded-For (může obsahovat seznam), poté běžné CDN/proxy hlavičky
  const candidates = [
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("true-client-ip"),
    req.headers.get("x-client-ip"),
    req.headers.get("fly-client-ip"),
  ].filter(Boolean) as string[];

  if (candidates.length > 0) {
    // XFF může být "client, proxy1, proxy2" → vem první
    const first = candidates[0].split(",")[0]?.trim();
    return first && first.length > 0 ? first : null;
  }

  // Žádná hlavička → nevíme
  return null;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(req) ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const fingerprint = sha256(`${ip}|${ua}`);

  // Zkus najít existující zařízení podle složeného unique klíče
  const existing = await prisma.loginDevice.findUnique({
    where: { userId_fingerprint: { userId: session.user.id, fingerprint } },
  });

  if (!existing) {
    await prisma.loginDevice.create({
      data: {
        userId: session.user.id,
        fingerprint,
        lastIp: ip !== "unknown" ? ip : null,
        lastUA: ua !== "unknown" ? ua : null,
      },
    });

    await sendNewDeviceLogin(session.user.email, {
      ip,
      userAgent: ua,
      whenISO: new Date().toISOString(),
      cityCountry: null, // případně doplň geolokaci IP
      secureUrl: "/settings/security",
    });
  } else {
    await prisma.loginDevice.update({
      where: { userId_fingerprint: { userId: session.user.id, fingerprint } },
      data: {
        lastSeen: new Date(),
        count: existing.count + 1,
        lastIp: ip !== "unknown" ? ip : existing.lastIp,
        lastUA: ua !== "unknown" ? ua : existing.lastUA,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
