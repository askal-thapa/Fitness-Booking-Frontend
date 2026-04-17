"use client";

import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { trainerApi } from '@/lib/api';
import { Trainer } from '@/types';
import { Avatar } from './ui/Avatar';

export default function Testimonials() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const all = await trainerApi.getAll();
        // Pick trainers with good ratings
        setTrainers(all.filter(t => (t.rating || 0) >= 4).slice(0, 3));
      } catch (err) {
        console.error("Failed to load trainers for testimonials", err);
      }
    };
    fetch();
  }, []);

  if (trainers.length === 0) return null;

  return (
    <section className="py-24 bg-primary/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">Trusted Professionals</span>
          <h2 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight">
            Meet our <span className="text-primary">top-rated</span> trainers
          </h2>
          <p className="text-warm-gray max-w-xl mx-auto mt-4 text-lg">
            Professionals who consistently deliver results and earn outstanding reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="bg-white rounded-2xl border border-cream-darker p-8 hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-5">
                <Avatar src={trainer.imageUrl} name={trainer.name} size="lg" className="rounded-full" />
                <div>
                  <h4 className="font-bold text-warm-dark">{trainer.name}</h4>
                  <p className="text-xs text-primary font-medium">{trainer.specialty}</p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`w-4 h-4 ${star <= Math.round(trainer.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-cream-darker'}`} />
                ))}
                <span className="text-sm font-semibold text-warm-dark ml-2">{trainer.rating?.toFixed(1) || '5.0'}</span>
              </div>

              <div className="relative">
                <Quote className="w-5 h-5 text-primary/20 mb-2" />
                <p className="text-warm-gray text-sm leading-relaxed line-clamp-3">
                  {trainer.bio}
                </p>
              </div>

              {trainer.focus && trainer.focus.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-cream-darker">
                  {trainer.focus.slice(0, 3).map(f => (
                    <span key={f} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/15 font-medium">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
