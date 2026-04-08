"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32 flex-1 w-full space-y-12 text-warm-dark">
        <section className="space-y-6">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest block">Data Security</span>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy.</h1>
          <p className="text-warm-gray">Last updated: April 2026</p>
        </section>

        <section className="space-y-8 max-w-none">
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">1. Data Collection</h2>
            <p className="text-warm-gray leading-relaxed">
              We collect information you provide directly to us when you create an account, complete your fitness onboarding, or communicate with trainers. This includes metrics like height, weight, and health conditions to personalize your experience.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">2. Use of Information</h2>
            <p className="text-warm-gray leading-relaxed">
              Your data is used strictly to provide and improve our services, including the creation of personalized training plans and facilitating bookings with elite professionals.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-dark mb-3">3. Data Sharing</h2>
            <p className="text-warm-gray leading-relaxed">
              We do not sell your personal data. Metric information is shared with your chosen trainers only to enhance your training efficacy.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
