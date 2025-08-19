import { renderLayout } from "./base";

export function accountDeletionConfirmHtml(atISO: string): string {
  const content = `
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">
    Your account has been scheduled for deletion and will be permanently removed soon.
  </p>
  <p style="margin:0 0 0;font-size:14px;color:#6b7280;">
    Timestamp: ${atISO}
  </p>`;
  return renderLayout({
    title: "⚠️ Account deletion scheduled",
    preheader: "Your Captioni account is scheduled for deletion.",
    contentHtml: content,
    footerNote: "If this was a mistake, contact support immediately.",
  });
}

export function accountDeletionConfirmText(atISO: string): string {
  return `Your Captioni account is scheduled for deletion.
Timestamp: ${atISO}
If this was a mistake, contact support immediately.`;
}
