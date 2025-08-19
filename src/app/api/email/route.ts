import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
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
