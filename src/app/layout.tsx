import { Nunito } from "next/font/google";
import "../styles/globals.css";
import "../styles/fonts.css";
import Providers from "./providers";
import type { Metadata } from "next";
import Script from "next/script";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://captioni.com"),
  title: "Captioni – AI caption generator for Instagram, TikTok & OnlyFans",
  description: "Create catchy captions, bios, hashtags and stories in seconds. Try the free demo and upgrade anytime.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://captioni.com",
    title: "Captioni – AI caption generator",
    description: "Create catchy captions, bios, hashtags and stories in seconds.",
    siteName: "Captioni",
    images: [{ url: "/og/og-image.jpg", width: 1200, height: 630, alt: "Captioni preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Captioni – AI caption generator",
    description: "Create catchy captions, bios, hashtags and stories in seconds.",
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
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Plausible basic script (bez outbound-links pluginu) */}
        <Script
          defer
          data-domain="captioni.com"
          src="https://plausible.io/js/script.js"
        />

        {/* (Volitelně) jednoduchý init, když chceš volat window.plausible ručně */}
        <Script id="plausible-init" strategy="afterInteractive">
          {`
            window.plausible = window.plausible || function() {
              (window.plausible.q = window.plausible.q || []).push(arguments);
            };
          `}
        </Script>

        {/* PWA Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>

        {/* PWA meta tags pro iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Captioni" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#667eea" />
      </head>

      <body className={nunito.className}>
        <Providers>{children}</Providers>

        {/* JSON-LD */}
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Captioni",
              url: "https://captioni.com",
              logo: "https://captioni.com/icons/icon-512.png",
              sameAs: [
                "https://twitter.com/captioni",
                "https://www.instagram.com/captioni"
              ]
            }),
          }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://captioni.com",
              name: "Captioni",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://captioni.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        <Script
          id="ld-app"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Captioni",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://captioni.com",
              description: "AI captions, bios, hashtags and stories for Instagram, TikTok & OnlyFans.",
              offers: [
                { "@type": "Offer", price: "0",  priceCurrency: "USD", category: "Free" },
                { "@type": "Offer", price: "9",  priceCurrency: "USD", category: "Starter" },
                { "@type": "Offer", price: "19", priceCurrency: "USD", category: "Pro" },
                { "@type": "Offer", price: "49", priceCurrency: "USD", category: "Premium" }
              ]
            }),
          }}
        />

        {/* ✅ Lehký delegovaný tracking přes data-atributy (bez layout thrashingu) */}
        <Script id="plausible-delegate" strategy="afterInteractive">
          {`(function(){
            function parseProps(el){
              try { var raw = el.getAttribute('data-pt-props'); return raw ? JSON.parse(raw) : undefined; }
              catch(_) { return undefined; }
            }
            document.addEventListener('click', function(e){
              var el = e.target && e.target.closest && e.target.closest('[data-pt-event]');
              if (!el) return;
              var name = el.getAttribute('data-pt-event');
              if (!name) return;
              var opts = parseProps(el);
              if (typeof window.plausible === 'function') {
                window.plausible(name, opts ? { props: opts } : undefined);
              }
            }, { capture: true });
          })();`}
        </Script>

        {/* ✅ Rewardful affiliate tracking */}
        <Script src="https://r.wdfl.co/rw.js" data-rewardful="7f3325" />
        <Script id="rewardful-queue" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
      </body>
    </html>
  );
}
