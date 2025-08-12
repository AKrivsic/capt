// app/api/debug/mailtrap/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const tr = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT ?? 2525),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await tr.verify();

    const info = await tr.sendMail({
      from: process.env.EMAIL_FROM,
      to: "test@example.com",
      subject: "Mailtrap debug",
      text: "Hello from debug endpoint.",
    });

    return NextResponse.json({ ok: true, messageId: info.messageId }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : JSON.stringify(e);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

