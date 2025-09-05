export const dynamic = "force-dynamic";

import Link from "next/link";
import { BRAND } from "@/lib/email/branding";
import { headers } from "next/headers";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function MagicAuthPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const token = typeof sp?.token === "string" ? sp?.token : Array.isArray(sp?.token) ? (sp?.token as string[])[0] : null;
  const emailRaw = typeof sp?.email === "string" ? sp?.email : Array.isArray(sp?.email) ? (sp?.email as string[])[0] : null;
  const callbackUrl = typeof sp?.callbackUrl === "string" ? sp?.callbackUrl : Array.isArray(sp?.callbackUrl) ? (sp?.callbackUrl as string[])[0] : null;

  // Robustní dekódování e-mailu (zvládne email=%40 i email=%2540)
  const email = (() => {
    if (!emailRaw) return null;
    try {
      const once = decodeURIComponent(emailRaw);
      // Pokud po prvním dekódu zůstane %xx, zkusíme dekódovat podruhé
      if (/%[0-9A-Fa-f]{2}/.test(once)) {
        try {
          return decodeURIComponent(once);
        } catch {
          return once;
        }
      }
      return once;
    } catch {
      return emailRaw;
    }
  })();

  if (!token || !email) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(135deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.cta} 100%)`,
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: BRAND.colors.card,
            borderRadius: 16,
            border: `1px solid ${BRAND.colors.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: 28,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: BRAND.colors.sub, marginBottom: 8 }}>Captioni</div>
          <h1 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: BRAND.colors.text }}>Unable to sign in</h1>
          <p style={{ color: BRAND.colors.sub, margin: 0 }}>
            The magic link is missing required parameters. Please request a new link.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${BRAND.colors.border}`,
              color: BRAND.colors.text,
              textDecoration: "none",
              background: "white",
            }}
          >
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  // Sestavíme absolutní URL callbacku včetně originu (https://captioni.com)
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "captioni.com";
  const origin = `${proto}://${host}`;
  let action = `${origin}/api/auth/callback/email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  if (callbackUrl) {
    action += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(135deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.cta} 100%)`,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: BRAND.colors.card,
          borderRadius: 16,
          border: `1px solid ${BRAND.colors.border}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, color: BRAND.colors.sub, marginBottom: 8 }}>Captioni</div>
        <h1 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: BRAND.colors.text }}>Sign in</h1>
        <p style={{ color: BRAND.colors.sub, margin: 0, marginBottom: 16 }}>
          Click the button to complete sign in.
        </p>

        <a
          href={action}
          style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: 12,
            background: BRAND.colors.accent,
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Continue
        </a>

        <div style={{ marginTop: 14, fontSize: 12, color: BRAND.colors.sub, wordBreak: "break-all" }}>
          If the button doesn’t work, copy this URL into your browser:
          <div style={{ marginTop: 6 }}>
            <code>{action}</code>
          </div>
        </div>
      </div>
    </div>
  );
}



