import { renderLayout, buttonHtml } from "./base";
import { BRAND } from "../branding";

export type DeviceInfo = {
  ip?: string | null;
  userAgent?: string | null;
  whenISO?: string | null;     // ISO string datumu
  cityCountry?: string | null; // "Prague, CZ" apod.
  secureUrl: string;           // link na security settings / revoke sessions
};

export function newDeviceLoginHtml(info: DeviceInfo): string {
  const parts: string[] = [];
  if (info.cityCountry) parts.push(`<li>Location: <strong>${info.cityCountry}</strong></li>`);
  if (info.ip)          parts.push(`<li>IP: <strong>${info.ip}</strong></li>`);
  if (info.userAgent)   parts.push(`<li>Device: <strong>${info.userAgent}</strong></li>`);
  if (info.whenISO)     parts.push(`<li>Time: <strong>${info.whenISO}</strong></li>`);

  const content = `
  <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">
    A new sign-in to your ${BRAND.appName} account was detected.
  </p>
  <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.6;color:${BRAND.colors.sub};">
    ${parts.join("")}
  </ul>
  <p style="margin:0 0 16px;font-size:14px;color:${BRAND.colors.sub};">
    If this wasn't you, please secure your account immediately.
  </p>
  ${buttonHtml("Secure account", info.secureUrl)}
  `;
  return renderLayout({
    title: "🛡️ New sign-in detected",
    preheader: "We noticed a new sign-in to your Captioni account.",
    contentHtml: content,
  });
}

export function newDeviceLoginText(info: DeviceInfo): string {
  return `New sign-in detected on your Captioni account
${info.cityCountry ? `Location: ${info.cityCountry}\n` : ""}${info.ip ? `IP: ${info.ip}\n` : ""}${info.userAgent ? `Device: ${info.userAgent}\n` : ""}${info.whenISO ? `Time: ${info.whenISO}\n` : ""}

If this wasn't you, secure your account:
${info.secureUrl}`;
}
