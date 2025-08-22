import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ——— povolené (transakční) eventy, které nás zajímají ———
const ALLOWED_EVENTS = new Set<string>([
  "email.delivered",
  "email.bounced",
  "email.complained",
  "email.failed",
]);

// ——— Zod schéma pro základní validaci těla webhooku ———
const WebhookBodySchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
});

// ——— Pomocné „type-safe“ extraktory (bez any) ———
function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") return [value];
  return [];
}

type EmailMeta = {
  to: string | null;
  from: string | null;
  subject: string | null;
  messageId: string | null;
};

function extractEmailMeta(data: Record<string, unknown>): EmailMeta {
  const toArr = asStringArray(data["to"]);
  const to = toArr.length > 0 ? toArr.join(",") : null;

  const from = asString(data["from"]);
  const subject = asString(data["subject"]);

  // Resend posílá buď "id" nebo "messageId" (závisí na eventu)
  const messageId = asString(data["id"]) ?? asString(data["messageId"]);

  return { to, from, subject, messageId };
}

export async function POST(req: NextRequest) {
  // (Volitelné) jednoduché ověření tajného tokenu v query ?token=...
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.RESEND_WEBHOOK_TOKEN;
  if (expected && token !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let parsedBody: z.infer<typeof WebhookBodySchema>;
  try {
    const json = await req.json();
    const parsed = WebhookBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }
    parsedBody = parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { type, data } = parsedBody;

  // Pokud event neřešíme, vracíme 200 (Resend pak nere-tryuje) a jen ignorujeme.
  if (!ALLOWED_EVENTS.has(type)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Uložení do DB
  try {
    const meta = extractEmailMeta(data as Record<string, unknown>);

    await prisma.emailEvent.create({
  data: {
    type,
    to: meta.to ?? undefined,
    from: meta.from ?? undefined,
    subject: meta.subject ?? undefined,
    messageId: meta.messageId ?? undefined,
    // ✅ bezpečný JSON pro Prisma
    details: JSON.parse(JSON.stringify(parsedBody)) as Prisma.InputJsonValue,
  },
});

    // rychlá odpověď, ať Resend ne-retryuje
    return NextResponse.json({ ok: true });
  } catch (err) {
    // u webhooků je často lepší vrátit 200, logovat a řešit asynchronně,
    // aby provider neprováděl nekonečné retry
    console.error("[RESEND WEBHOOK ERROR]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
