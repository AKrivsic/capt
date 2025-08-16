import { Nunito } from 'next/font/google';
import "../styles/globals.css";
import Providers from "./providers";
import type { Metadata } from "next";

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'] });



export const metadata: Metadata = {
  metadataBase: new URL("https://captioni.com"),
  title: "Captioni – AI caption generator for Instagram, TikTok & OnlyFans",
  description:
    "Create catchy captions, bios, hashtags and stories in seconds. Try the free demo and upgrade anytime.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://captioni.com",
    title: "Captioni – AI caption generator",
    description:
      "Create catchy captions, bios, hashtags and stories in seconds.",
    siteName: "Captioni",
    images: [
      {
        url: "/og/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Captioni preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Captioni – AI caption generator",
    description:
      "Create catchy captions, bios, hashtags and stories in seconds.",
    images: ["/og/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

