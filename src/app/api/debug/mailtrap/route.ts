// src/app/api/debug/mailtrap/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { assertSameOrigin } from "@/lib/origin";

type Json = { ok: boolean; messageId?: string; error?: string };

export async function GET(req: NextRequest): Promise<NextResponse<Json>> {
  // V produkci endpoint neexistuje
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Ochrana proti CSRF / cizím původům
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  }

  // Povolit jen adminům
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Načti nodemailer až tady (jen ve vývoji)
  const { default: nodemailer } = await import("nodemailer");

  // SMTP hodnoty: použij Mailtrap defaulty, port 2525
  const host = process.env.EMAIL_SERVER_HOST ?? "sandbox.smtp.mailtrap.io";
  const port = Number(process.env.EMAIL_SERVER_PORT ?? 2525);
  const user = process.env.EMAIL_SERVER_USER ?? "";
  const pass = process.env.EMAIL_SERVER_PASSWORD ?? "";
  const from = process.env.EMAIL_FROM ?? "Captioni <no-reply@captioni.com>";

  if (!user || !pass) {
    return NextResponse.json(
      { ok: false, error: "Missing EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD" },
      { status: 400 }
    );
  }

  try {
    const tr = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await tr.verify();

    const info = await tr.sendMail({
      from,
      to: "test@example.com",
      subject: "Mailtrap debug",
      text: "Hello from debug endpoint.",
    });

    return NextResponse.json({ ok: true, messageId: info.messageId }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}