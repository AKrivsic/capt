import { Resend } from "resend";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[]; // povol i pole
};

export async function sendTransactionalEmail(params: SendEmailParams) {
  const { to, subject, html, text, replyTo } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing EMAIL_FROM");

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
    replyTo, // ✅ camelCase, string nebo string[]
  });

  if (error) throw new Error(`Resend error: ${String(error)}`);
  return data;
}
