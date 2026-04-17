import React from 'react';
import { UserPlus, Search, CalendarCheck, Trophy } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Create Your Profile',
    description: 'Sign up and complete your fitness onboarding to tell us about your goals, experience, and preferences.',
    icon: <UserPlus className="w-6 h-6" />,
    className: 'sm:col-span-2 lg:col-span-1',
  },
  {
    step: '02',
    title: 'Find Your Trainer',
    description: 'Browse our curated directory or get AI-powered recommendations matched to your exact fitness profile.',
    icon: <Search className="w-6 h-6" />,
    className: 'sm:col-span-2 lg:col-span-1',
  },
  {
    step: '03',
    title: 'Book a Session',
    description: 'Pick a date, choose your time slot, and confirm your booking with secure Stripe payment.',
    icon: <CalendarCheck className="w-6 h-6" />,
    className: 'sm:col-span-2 lg:col-span-1',
  },
  {
    step: '04',
    title: 'Achieve Results',
    description: 'Train with your professional, track your progress, leave reviews, and keep leveling up.',
    icon: <Trophy className="w-6 h-6" />,
    className: 'sm:col-span-2 lg:col-span-1',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight">
            Your journey in <span className="text-primary">4 simple steps</span>
          </h2>
          <p className="text-warm-gray max-w-xl mx-auto mt-4 text-lg">
            From sign-up to your first session, we make the entire process effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => (
            <div key={idx} className={`relative bg-white rounded-2xl border border-cream-darker p-8 hover:shadow-md hover:border-primary/20 transition-all group ${item.className}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <span className="text-4xl font-bold text-cream-darker group-hover:text-primary/20 transition-colors">{item.step}</span>
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
