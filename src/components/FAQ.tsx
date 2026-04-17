"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the trainer matching work?',
    answer: 'When you complete your fitness profile during onboarding, our system analyzes your goals, experience level, activity level, and preferences. It then scores and ranks trainers based on how well their specialties, intensity level, and training focus align with your needs.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We use Stripe for secure payment processing, which supports all major credit and debit cards including Visa, Mastercard, and American Express. All transactions are encrypted and PCI-compliant.',
  },
  {
    question: 'Can I cancel or reschedule a booking?',
    answer: 'Yes, you can cancel upcoming bookings from your dashboard. We recommend cancelling at least 24 hours before your session. The cancellation policy may vary by trainer.',
  },
  {
    question: 'How are trainers verified?',
    answer: 'Every trainer on Askal goes through a vetting process that includes certification verification, experience review, and client reference checks. We only accept professionals who meet our quality standards.',
  },
  {
    question: 'Is there a subscription or membership fee?',
    answer: 'No, Askal has no subscription fees. You only pay per session when you book a trainer. Pricing is set by individual trainers and displayed transparently on their profiles.',
  },
  {
    question: 'Can I become a trainer on Askal?',
    answer: 'Absolutely! Register as a Professional Trainer during sign-up. You\'ll be able to set your availability, pricing, specialties, and start accepting client bookings right away.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-cream">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight">
            Common questions, <span className="text-primary">clear answers</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-primary/20 shadow-sm' : 'border-cream-darker'}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-warm-dark pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-warm-gray shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 -mt-2">
                    <p className="text-warm-gray leading-relaxed text-sm">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
