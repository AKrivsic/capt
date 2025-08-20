// src/app/verify-request/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email | Captioni",
  description:
    "We’ve sent you a sign-in link. Open it in this browser to finish signing in.",
  robots: { index: false, follow: false }, // interní/technická stránka — neindexovat
  alternates: { canonical: "/verify-request" },
  openGraph: {
    title: "Verify your email | Captioni",
    description:
      "We’ve sent you a sign-in link. Open it in this browser to finish signing in.",
    url: "/verify-request",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Verify your email | Captioni",
    description:
      "We’ve sent you a sign-in link. Open it in this browser to finish signing in.",
  },
};

export default function VerifyRequest() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #8B5CF6 0%, #34D399 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Captioni</div>
        <h1 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: "#111827" }}>Check your email</h1>
        <p style={{ color: "#6b7280", margin: 0 }}>
          We sent you a sign‑in link. Open it in this browser to finish signing in.
        </p>
      </div>
    </div>
  );
}
