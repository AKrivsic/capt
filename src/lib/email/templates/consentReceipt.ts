import { renderLayout } from "./base";
import { BRAND } from "../branding";

export function consentReceiptHtml(marketing: boolean, atISO: string): string {
  const status = marketing ? "opted in to" : "opted out of";
  const content = `
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
    You have ${status} ${BRAND.appName} marketing emails.
  </p>
  <p style="margin:0 0 0;font-size:14px;color:${BRAND.colors.sub};">
    Timestamp: ${atISO}
  </p>`;
  return renderLayout({
    title: "✅ Your email preferences were updated",
    preheader: "Confirmation of your email preference change.",
    contentHtml: content,
  });
}

export function consentReceiptText(marketing: boolean, atISO: string): string {
  const status = marketing ? "opted in" : "opted out";
  return `Your email preferences were updated
You have ${status} to marketing emails.
Timestamp: ${atISO}`;
}
