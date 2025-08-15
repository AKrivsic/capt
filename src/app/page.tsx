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

export default function HomePage() {
  return (
    <>
       <Suspense fallback={null}>
        <ConsentOnHome />
      </Suspense>
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
      <FinalCTA />
      <Footer />
    </>
  );
}

