import { BRAND } from "../branding";

type LayoutParams = {
  title: string;        // hlavní H1
  preheader?: string;   // skryté, pro inboxy
  contentHtml: string;  // vlastní obsah
  footerNote?: string;  // volitelná poznámka
};

export function renderLayout({ title, preheader, contentHtml, footerNote }: LayoutParams): string {
  const { colors } = BRAND;
  const pre = preheader ?? "";
  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:${colors.bg};color:${colors.text};
               font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${pre}</div>
    <div style="max-width:520px;margin:0 auto;background:${colors.card};
                border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="padding:28px;border-bottom:4px solid ${colors.accent};">
        <h1 style="margin:0;font-size:20px;line-height:1.3;text-align:center;">${title}</h1>
      </div>
      <div style="padding:24px 28px 8px;">
        ${contentHtml}
      </div>
      <div style="padding:20px 28px 28px;border-top:1px solid ${colors.border};color:${colors.sub};font-size:13px;">
        <p style="margin:0;">If you didn’t request this, you can safely ignore this email.</p>
        <p style="margin:8px 0 0;">❤️ The ${BRAND.appName} Team</p>
        ${footerNote ? `<p style="margin:8px 0 0;">${footerNote}</p>` : ""}
      </div>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:12px;color:#888;">
      Sent by ${BRAND.appName} • ${BRAND.from.replace(/^.*<|>$/g, "")}
    </div>
  </body>
</html>`;
}

export function buttonHtml(label: string, href: string): string {
  return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="background:${BRAND.colors.cta};color:#fff;text-decoration:none;
       padding:14px 24px;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">
      ${label}
    </a>
  </div>`;
}
