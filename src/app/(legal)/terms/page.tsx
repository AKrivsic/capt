import type { Metadata } from "next";
import { PrivacyContent } from "@/components/LegalContent/LegalContent";

export const metadata: Metadata = {
  title: "Privacy Policy — Captioni",
  description:
    "Learn how Captioni handles your personal data, including account, payment, and abuse-prevention information. No tracking cookies.",
  alternates: { canonical: "/privacy" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "article",
    title: "Privacy Policy — Captioni",
    description:
      "How Captioni handles personal data. No tracking cookies.",
    url: "/privacy",
    siteName: "Captioni",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — Captioni",
    description:
      "How Captioni handles personal data. No tracking cookies.",
  },
};

export default function PrivacyPage() {
  return (
    <main style={{ padding: "24px 16px", maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Privacy Policy
      </h1>
      <PrivacyContent />
    </main>
  );
}
