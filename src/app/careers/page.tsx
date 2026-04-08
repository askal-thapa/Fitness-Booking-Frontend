"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/Card";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32 flex-1 w-full space-y-14">
        <section className="space-y-6">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest block">Join the Team</span>
          <h1 className="text-4xl md:text-5xl font-bold text-warm-dark tracking-tight">Build the Future of Fitness.</h1>
          <p className="text-warm-gray text-lg leading-relaxed">
            We are looking for visionary engineers, designers, and fitness experts to help us scale the world's most premium training ecosystem.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-widest">Open Positions</h2>
          <div className="grid grid-cols-1 gap-4">
            {["Senior Full-Stack Engineer", "Product Designer (UI/UX)", "Head of Trainer Success"].map((job) => (
              <Card key={job} className="p-5 flex justify-between items-center hover:border-primary/30 transition-all">
                <span className="text-warm-dark font-semibold">{job}</span>
                <span className="text-primary text-xs font-semibold">Apply</span>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
