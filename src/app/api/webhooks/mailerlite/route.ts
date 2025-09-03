import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ——— util bez any ———
function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function hmac(secret: string, payload: string, enc: "hex" | "base64"): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest(enc);
}

type MLBody = { type: string; data?: unknown };

function toStringProp(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function extractEmail(data: unknown): string | null {
  const direct = toStringProp(data, "email");
  if (direct) return direct;
  const subscriber = (data && typeof data === "object")
    ? (data as Record<string, unknown>)["subscriber"]
    : undefined;
  const subEmail = toStringProp(subscriber, "email");
  return subEmail;
}

function extractStatus(data: unknown): string | null {
  return toStringProp(data, "status"); // "active" | "unsubscribed" | ...
}

type Action = "optin" | "optout" | "noop";

function mapAction(type: string, data: unknown): Action {
  const t = type.toLowerCase();
  if (t === "subscriber.active") return "optin";
  if (t === "subscriber.unsubscribed" || t === "subscriber.spam_reported" || t === "subscriber.bounced" || t === "subscriber.deleted") {
    return "optout";
  }
  if (t === "subscriber.updated") {
    const status = extractStatus(data);
    if (status === "active") return "optin";
    if (status === "unsubscribed") return "optout";
  }
  return "noop";
}

export async function POST(req: NextRequest) {
  // 1) načti RAW tělo kvůli HMAC
  const raw = await req.text();

  // 2) ověř podpis (nové ML: `Signature`, classic: `X-MailerLite-Signature`)
  const secret = process.env.MAILERLITE_WEBHOOK_SECRET ?? "";
  const sig = req.headers.get("signature") ?? req.headers.get("x-mailerlite-signature");
  if (secret) {
    if (!sig) return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
    const hex = hmac(secret, raw, "hex");
    const b64 = hmac(secret, raw, "base64"); // classic posílá často base64
    const ok = timingSafeEqual(sig, hex) || timingSafeEqual(sig, b64);
    if (!ok) return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  } else {
    // fallback: query token (pokud HMAC zatím nepoužíváš)
    const token = req.nextUrl.searchParams.get("token");
    const expected = process.env.MAILERLITE_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  // 3) parse JSON až po ověření podpisu
  let body: MLBody | null = null;
  try {
    body = JSON.parse(raw) as MLBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body?.type) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  // ✅ IDEMPOTENCE: Kontrola, zda už event zpracováváme
  try {
    await prisma.webhookEvent.create({
      data: {
        source: "mailerlite",
        eventId: `${body.type}-${Date.now()}`, // ML nemá event ID, použijeme timestamp
        processed: false,
      },
    });
  } catch (error: unknown) {
    // Duplicitní event - ignorujeme
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === "P2002") {
      console.log("[mailerlite/webhook] Duplicate event ignored:", body.type);
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw error;
  }

  const email = extractEmail(body.data);
  const action = mapAction(body.type, body.data);

  // Pokud nemáme email nebo je to noop → potvrď 200 a nic nedělej (ať ML nere-tryuje)
  if (!email || action === "noop") {
    return NextResponse.json({ ok: true });
  }

  // 4) promítnout do DB (ConsentLog + flag u známých uživatelů)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const ua = req.headers.get("user-agent") ?? undefined;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.consentLog.create({
        data: {
          userId: user.id,
          scope: "marketing",
          value: action === "optin",
          ip,
          userAgent: ua,
          sourceUrl: "mailerlite:webhook",
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { marketingConsent: action === "optin", marketingConsentAt: new Date() },
      });
    } else {
      // volitelné: log i pro „neznámé“ e-maily
      await prisma.consentLog.create({
        data: {
          userId: "anonymous",
          scope: "marketing",
          value: action === "optin",
          ip,
          userAgent: ua,
          sourceUrl: "mailerlite:webhook",
        },
      }).catch(() => undefined);
    }

    // 5) okamžitě vrať 200 (ML jinak retryuje; limit je 3 pokusy s backoffem) :contentReference[oaicite:3]{index=3}
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MailerLite webhook error]", err);
    // V produkci často i při chybě vracíme 200, aby se eventy nekupily. :contentReference[oaicite:4]{index=4}
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
