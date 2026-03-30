"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TrainerCard from './TrainerCard';
import { trainerApi } from '@/lib/api';
import { Trainer } from '@/types';

export default function Trainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const data = await trainerApi.getAll();
        setTrainers(data.slice(0, 3)); // Featured 3 on landing page
      } catch (err) {
        console.error("Failed to fetch trainers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
          <div className="max-w-2xl">
            <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">Our Professionals</span>
            <h2 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight leading-tight">
              Trained by the <span className="text-primary italic">Very Best</span>
            </h2>
          </div>
          <Link href="/trainers" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-2 border-b border-primary/30 pb-1">
            Browse All Trainers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
             [1,2,3].map(i => (
                <div key={i} className="h-[450px] bg-cream-dark rounded-2xl animate-pulse border border-cream-darker" />
             ))
          ) : trainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      </div>
    </section>
  );
}
