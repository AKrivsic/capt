import Hero from "@/components/Hero";
import Generator from "@/components/Generator";
import Testimonials from "@/components/Testimonials";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <header>
        <h2>Captioni ✨</h2>
      </header>
      <Hero />
      <Testimonials />
      <Generator />
      <Benefits />
      <Footer />
    </>
  );
}
