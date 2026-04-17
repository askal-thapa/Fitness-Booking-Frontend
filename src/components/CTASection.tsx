import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-warm-dark tracking-tight mb-6">
          Ready to start your <span className="text-primary">transformation?</span>
        </h2>
        <p className="text-warm-gray text-lg max-w-2xl mx-auto mb-10">
          Join hundreds of members who are already training with the best professionals. Your first step starts here.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm text-lg hover:shadow-md active:scale-95 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/trainers"
            className="px-8 py-4 bg-cream-dark text-warm-dark border border-cream-darker rounded-xl font-semibold hover:shadow-md transition-all text-lg"
          >
            Browse Trainers
          </Link>
        </div>
      </div>
    </section>
  );
}
