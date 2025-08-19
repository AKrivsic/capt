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
    <main style={{ maxWidth: 520, margin: "64px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
        Check your email
      </h1>
      <p>
        We sent you a sign‑in link. Open it in this browser to finish signing in.
      </p>
    </main>
  );
}
