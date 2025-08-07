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

export default function HomePage() {
  return (
    <>
      <Header />
      
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <Testimonials />
      <Generator />
      <Benefits />
      <Previews />
      <Faq />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
}
