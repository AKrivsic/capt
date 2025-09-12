import { NextResponse } from "next/server";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function POST() {
  try {
    if (!resend) {
      return NextResponse.json({ ok: true, skipped: true, reason: "RESEND_API_KEY not set" });
    }
    const data = await resend.emails.send({
      from: "Captioni <no-reply@captioni.com>",
      to: "o.kryvshych@gmail.com", // sem dáš příjemce
      subject: "Test transactional email",
      html: "<p>Hello from Captioni 👋</p>",
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
