"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32 flex-1 w-full space-y-12 text-warm-dark">
        <section className="space-y-6">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest block">Legal Framework</span>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service.</h1>
          <p className="text-warm-gray">Last updated: April 2026</p>
        </section>

        <section className="space-y-8 max-w-none">
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">1. Acceptance of Terms</h2>
            <p className="text-warm-gray leading-relaxed">
              By accessing Askal Fit, you agree to comply with these terms. Our services are intended for users who are seeking professional fitness guidance.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">2. Professional Advice</h2>
            <p className="text-warm-gray leading-relaxed">
              Askal Fit provides a platform to connect with trainers. While we vet our professionals, we recommend consulting a physician before starting any new intensive physical program.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">3. Booking & Cancellations</h2>
            <p className="text-warm-gray leading-relaxed">
              Users are expected to respect the time of our elite trainers. Cancellations within 24 hours of a session may be subject to a fee as determined by the trainer's individual policy.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
