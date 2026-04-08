"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32 flex-1 w-full space-y-12">
        <section className="space-y-6">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest block">Our Story</span>
          <h1 className="text-4xl md:text-5xl font-bold text-warm-dark tracking-tight">Redefining Performance.</h1>
          <p className="text-warm-gray text-lg leading-relaxed">
            Askal Fit was founded on a single principle: that elite-level personal training should be accessible to those who demand the best from themselves.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-cream-darker">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-warm-dark tracking-tight">The Vision</h2>
            <p className="text-warm-gray leading-relaxed">
              We bridge the gap between sophisticated technology and human expertise. Our platform isn't just about booking; it's about curated transformations led by the industry's most dedicated professionals.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-warm-dark tracking-tight">The Standard</h2>
            <p className="text-warm-gray leading-relaxed">
              Every trainer on Askal Fit undergoes a rigorous vetting process. We prioritize certifications, real-world results, and a commitment to scientific biomechanics.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
