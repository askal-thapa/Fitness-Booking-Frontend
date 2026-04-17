"use client";

import React from 'react';
import { Shield, TrendingUp, Clock, Sparkles, CreditCard, BarChart3 } from 'lucide-react';

const bentoItems = [
  {
    title: 'Verified Professionals',
    description: 'Every trainer is vetted with certifications, real results, and client references before joining our platform.',
    icon: <Shield className="w-6 h-6" />,
    className: 'md:col-span-2 md:row-span-1',
  },
  {
    title: 'Smart Matching',
    description: 'Our AI analyzes your goals, experience, and preferences to recommend the ideal trainer for you.',
    icon: <Sparkles className="w-6 h-6" />,
    className: 'md:col-span-1 md:row-span-2',
  },
  {
    title: 'Flexible Scheduling',
    description: 'Real-time availability with 7-day advance booking and instant confirmation.',
    icon: <Clock className="w-6 h-6" />,
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your fitness journey with performance metrics, session history, and trainer feedback.',
    icon: <BarChart3 className="w-6 h-6" />,
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    title: 'Secure Payments',
    description: 'Stripe-powered payments with checkout protection and transparent pricing per session.',
    icon: <CreditCard className="w-6 h-6" />,
    className: 'md:col-span-1 md:row-span-1',
  },
  {
    title: 'Results Driven',
    description: 'Join thousands who have transformed their fitness with personalized professional guidance.',
    icon: <TrendingUp className="w-6 h-6" />,
    className: 'md:col-span-1 md:row-span-1',
  },
];

export default function BentoGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">Why Askal</span>
          <h2 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight">
            Everything you need, <span className="text-primary">nothing you don&apos;t</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bentoItems.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border border-cream-darker p-8 hover:shadow-md hover:border-primary/20 transition-all group bg-cream/40 ${item.className}`}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-warm-dark mb-2">{item.title}</h3>
              <p className="text-warm-gray text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
