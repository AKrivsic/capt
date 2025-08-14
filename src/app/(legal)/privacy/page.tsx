import type { Metadata } from "next";
import { TermsContent } from "@/components/LegalContent/LegalContent";

export const metadata: Metadata = {
  title: "Terms of Service — Captioni",
  description:
    "Read Captioni's Terms of Service covering payments, refunds, acceptable use, anti-bot policy, and legal limitations.",
  alternates: { canonical: "/terms" },
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
    title: "Terms of Service — Captioni",
    description:
      "Payments, refunds, acceptable use, anti-bot policy, and legal limitations.",
    url: "/terms",
    siteName: "Captioni",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — Captioni",
    description:
      "Payments, refunds, acceptable use, anti-bot policy, and legal limitations.",
  },
};

export default function TermsPage() {
  return (
    <main style={{ padding: "24px 16px", maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Terms of Service
      </h1>
      <TermsContent />
    </main>
  );
}
