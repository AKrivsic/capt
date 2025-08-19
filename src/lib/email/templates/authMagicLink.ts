import { renderLayout, buttonHtml } from "./base";
import { BRAND } from "../branding";

export function authMagicLinkHtml(url: string): string {
  const safe = encodeURI(url);
  const content = `
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
    Click the button below to sign in. This link works once and expires in 15 minutes.
  </p>
  ${buttonHtml("Sign in to Captioni", safe)}
  <p style="margin:16px 0 0;font-size:13px;color:${BRAND.colors.sub};word-break:break-all;">
    Or paste this link into your browser:<br/>
    <a href="${safe}" style="color:${BRAND.colors.accent};text-decoration:underline;">${safe}</a>
  </p>`;
  return renderLayout({
    title: "✨ Sign in to Captioni",
    preheader: "Your Captioni magic link — valid for 15 minutes.",
    contentHtml: content,
  });
}

export function authMagicLinkText(url: string): string {
  return `Sign in to Captioni

Use this link within 15 minutes:
${url}

If you didn’t request this, you can ignore this email.
— The Captioni Team`;
}
