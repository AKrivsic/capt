import { renderLayout, buttonHtml } from "./base";
import { BRAND } from "../branding";

export function passwordResetHtml(url: string): string {
  const safe = encodeURI(url);
  const content = `
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
    We received a request to reset your password. This link expires in 30 minutes.
  </p>
  ${buttonHtml("Reset password", safe)}
  <p style="margin:16px 0 0;font-size:13px;color:${BRAND.colors.sub};word-break:break-all;">
    If the button doesn't work, copy and paste this URL:<br/>
    <a href="${safe}" style="color:${BRAND.colors.accent};text-decoration:underline;">${safe}</a>
  </p>`;
  return renderLayout({
    title: "🔒 Reset your password",
    preheader: "Use this secure link to reset your Captioni password.",
    contentHtml: content,
  });
}

export function passwordResetText(url: string): string {
  return `Reset your Captioni password

Use this link within 30 minutes:
${url}

If you didn’t request this, you can ignore this email.`;
}
