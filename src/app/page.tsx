import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import BentoGrid from "@/components/BentoGrid";
import Testimonials from "@/components/Testimonials";
import Trainers from "@/components/Trainers";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Trainers />
        <Testimonials />
        <BentoGrid />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
