import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Captioni – Support & Help Center",
  description:
    "Need help with Captioni? Contact our support team at support@captioni.com. We usually reply within 24 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Captioni – Support & Help Center",
    description:
      "Need help with Captioni? Contact our support team at support@captioni.com. We usually reply within 24 hours.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Captioni – Support & Help Center",
    description:
      "Need help with Captioni? Contact our support team at support@captioni.com. We usually reply within 24 hours.",
  },
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <article style={{ maxWidth: 720, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Contact Captioni</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>We’d love to hear from you. Questions, feedback, or just want to say hi?</p>
        <p style={{ color: "#555", marginBottom: 12 }}>Our support team is here for you.</p>
        <p style={{ marginTop: 16 }}>
          <a href="mailto:support@captioni.com" style={{ fontWeight: 700, textDecoration: "underline" }}>
            📩 Email: support@captioni.com
          </a>
        </p>
        <p style={{ color: "#777", marginTop: 8 }}>We usually reply within 24 hours.</p>
      </article>
    </div>
  );
}


