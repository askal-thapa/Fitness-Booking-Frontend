"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32 flex-1 w-full space-y-14">
        <section className="space-y-6 text-center">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest block">Support</span>
          <h1 className="text-4xl md:text-5xl font-bold text-warm-dark tracking-tight">Get in Touch.</h1>
          <p className="text-warm-gray text-lg max-w-xl mx-auto">
            Have questions about our trainers or corporate programs? Our team is ready to assist.
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-cream-darker shadow-sm">
          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Name" placeholder="Your Name" />
              <Input label="Email" placeholder="email@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-warm-gray ml-1">Message</label>
              <textarea
                className="bg-cream rounded-xl border border-cream-darker px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-warm-dark placeholder:text-warm-gray/40 min-h-[150px]"
                placeholder="How can we help?"
              />
            </div>
            <Button fullWidth>Send Inquiry</Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
