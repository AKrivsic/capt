// src/lib/email/sendTransactional.ts
import { Resend } from "resend";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  from?: string; // optional override (jinak se použije EMAIL_FROM z env)
};

type ResendOk = { id: string | null };

const API_KEY = process.env.RESEND_API_KEY;
if (!API_KEY) throw new Error("Missing RESEND_API_KEY");

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? "Captioni <no-reply@auth.captioni.com>";

const resend = new Resend(API_KEY);

export async function sendTransactionalEmail(
  params: SendEmailParams
): Promise<ResendOk> {
  const { to, subject, html, text, replyTo, from } = params;

  const fromAddress = from ?? DEFAULT_FROM;
  if (!fromAddress) {
    throw new Error("Missing EMAIL_FROM and no 'from' provided");
  }

  const payload: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    reply_to?: string | string[];
  } = {
    from: fromAddress,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}), // Resend SDK používá reply_to
  };

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    const name = (error as { name?: string }).name ?? "Unknown";
    const message = (error as { message?: string }).message ?? "No message";
    // Čitelné logy + surová data (bez any)
    console.error("RESEND_SEND_FAILED", {
      name,
      message,
      raw: JSON.parse(JSON.stringify(error)),
      meta: { to, from: fromAddress, subject },
    });
    throw new Error(`RESEND_SEND_FAILED: ${name}: ${message}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("RESEND_SENT_OK", { to, id: data?.id ?? null });
  }

  return { id: data?.id ?? null };
}
