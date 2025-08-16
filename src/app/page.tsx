// src/app/page.tsx
import Hero from "@/components/Hero/Hero";
import Generator from "@/components/Generator/Generator";
import Testimonials from "@/components/Testimonials/Testimonials";
import Benefits from "@/components/Benefits/Benefits";
import Footer from "@/components/Footer/Footer";
import Previews from "@/components/Previews/Previews";
import Faq from "@/components/Faq/Faq";
import Pricing from "@/components/Pricing/Pricing";
import FinalCTA from "@/components/FinalCTA/FinalCTA";
import Header from "@/components/Header/Header";
import { Suspense } from "react";
import ConsentOnHome from "@/components/marketing/ConsentOnHome";
import BlogTeaser from "@/components/Blog/BlogTeaser";

export default function HomePage() {
  return (
    <>
       <Suspense fallback={null}>
        <ConsentOnHome />
      </Suspense>
      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Captioni",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI tool to generate captions, bios, hashtags and stories.",
      offers: {
        "@type": "Offer",
        price: "29.00",
        priceCurrency: "USD",
      },
      url: "https://captioni.com",
    }),
  }}
/>
      <Header />
      <Suspense fallback={null}>
        <Hero />
      </Suspense>

      {/* ⇩⇩⇩ přidaný anchor */}
      <section id="generator">
        <Generator />
      </section>
      {/* ⇧⇧⇧ */}

      <Benefits />
      <Previews />
      <Testimonials />
      <Pricing />
      <Faq />
      <BlogTeaser />
      <FinalCTA />
      <Footer />
    </>
  );
}

