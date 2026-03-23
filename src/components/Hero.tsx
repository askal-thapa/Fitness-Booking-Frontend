import Link from 'next/link';
import React from 'react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        <span className="inline-block py-2 px-4 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-6 border border-primary/15">
          Premium Performance Tracking
        </span>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-warm-darker mb-8 max-w-4xl leading-[1.1]">
          Elevate Your <span className="text-primary italic">Fitness Journey</span>
        </h1>
        <p className="text-lg md:text-xl text-warm-gray max-w-2xl mb-12 leading-relaxed">
          Experience tailored workout programs designed by elite professionals.
          Discover a seamless way to book world-class trainers and achieve exceptional results.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Link href="/login" className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm w-full sm:w-auto text-lg hover:shadow-md active:scale-95">
            Get Started Free
          </Link>
          <Link href="/trainers" className="px-8 py-4 bg-white text-warm-dark border border-cream-darker rounded-xl font-semibold hover:shadow-md transition-all w-full sm:w-auto text-lg">
            Explore Trainers
          </Link>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent opacity-[0.06] blur-[120px] -z-10 rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary opacity-[0.04] blur-[80px] -z-10 rounded-full"></div>
    </section>
  );
}
