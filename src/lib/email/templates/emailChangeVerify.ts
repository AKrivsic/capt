import { renderLayout, buttonHtml } from "./base";
import { BRAND } from "../branding";

export function emailChangeVerifyHtml(url: string, newEmail: string): string {
  const safe = encodeURI(url);
  const content = `
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
    Please confirm your new email address:<br/>
    <strong>${newEmail}</strong>
  </p>
  ${buttonHtml("Confirm email change", safe)}
  <p style="margin:16px 0 0;font-size:13px;color:${BRAND.colors.sub};word-break:break-all;">
    If you didn’t request this change, secure your account.
  </p>`;
  return renderLayout({
    title: "✉️ Confirm your new email",
    preheader: "Confirm your new email address for Captioni.",
    contentHtml: content,
  });
}

export function emailChangeVerifyText(url: string, newEmail: string): string {
  return `Confirm your new email for Captioni

New email: ${newEmail}
Confirm using this link:
${url}

If you didn’t request this, secure your account.`;
}
