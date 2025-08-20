export const dynamic = "force-dynamic";

import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function MagicAuthPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const token = typeof sp?.token === "string" ? sp?.token : Array.isArray(sp?.token) ? (sp?.token as string[])[0] : null;
  const emailRaw = typeof sp?.email === "string" ? sp?.email : Array.isArray(sp?.email) ? (sp?.email as string[])[0] : null;

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
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", padding: 24 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ marginBottom: 8 }}>Unable to sign in</h1>
          <p style={{ color: "#666" }}>The magic link is missing required parameters. Please request a new link.</p>
          <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd" }}>
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const action = `/api/auth/callback/email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ marginBottom: 8 }}>Sign in</h1>
        <p style={{ color: "#666", marginBottom: 16 }}>Click the button to complete sign in.</p>

        <a href={action} style={{ display: "inline-block", padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd" }}>
          Continue
        </a>

        <div style={{ marginTop: 12, fontSize: 12, color: "#888", wordBreak: "break-all" }}>
          If the button doesn’t work, copy this URL into your browser:
          <div style={{ marginTop: 6 }}><code>{action}</code></div>
        </div>

        <noscript>
          <p>JavaScript is not required here. Use the Continue link above.</p>
        </noscript>
      </div>
    </div>
  );
}



