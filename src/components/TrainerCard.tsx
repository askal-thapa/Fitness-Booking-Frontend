import Link from 'next/link';
import React from 'react';
import { Trainer } from '@/types';
import { Card } from './ui/Card';
import { TRAINING_FOCUS } from '@/lib/constants';
import { Star, ArrowRight, Zap } from 'lucide-react';

export default function TrainerCard({ trainer }: { trainer: Trainer }) {
  const getIcon = (name: string) =>
    TRAINING_FOCUS.find(f => f.value === name)?.icon || null;

  const allTags = Array.from(new Set([
    ...(trainer.focus || [])
  ].map(t => t.trim()))).slice(0, 4);

  return (
    <Link href={`/trainers/${trainer.id}`} className="group h-full">
      <Card className="p-4 space-y-4 hover:translate-y-[-4px] hover:shadow-lg transition-all flex flex-col h-full border-cream-darker bg-white">
        <div className="aspect-square rounded-xl overflow-hidden bg-cream-dark relative">
          <img
            src={trainer.imageUrl || ""}
            alt={trainer.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 text-warm-dark shadow-sm">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            {trainer.rating?.toFixed(1) || "5.0"}
          </div>
        </div>
        <div className="text-center flex-1 space-y-1">
          <h4 className="font-bold text-warm-dark text-lg group-hover:text-primary transition-colors tracking-tight">{trainer.name}</h4>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">{trainer.specialty}</p>

          <div className="flex flex-wrap justify-center gap-1.5 py-3">
            {allTags.length > 0 ? (
              allTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-cream-dark text-warm-gray px-2 py-1 rounded-full border border-cream-darker flex items-center gap-1"
                >
                  {getIcon(tag)}
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] bg-cream-dark text-warm-gray px-2 py-1 rounded-full border border-cream-darker">General Fitness</span>
            )}
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/15 font-semibold flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> Lvl {trainer.intensity}
            </span>
          </div>

          <p className="text-xs text-warm-gray line-clamp-2 leading-relaxed">{trainer.bio}</p>
        </div>
        <div className="pt-4 mt-auto">
          <div className="w-full py-2.5 bg-cream-dark border border-cream-darker text-warm-dark text-xs font-semibold rounded-xl group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all flex justify-center items-center gap-2">
            View Profile
            <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
