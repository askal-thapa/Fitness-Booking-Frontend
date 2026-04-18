"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrainerCard from "@/components/TrainerCard";
import { trainerApi } from "@/lib/api";
import { TRAINING_FOCUS } from "@/lib/constants";
import { Trainer } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

const LOCATIONS = ['Gym', 'Home', 'Virtual'] as const;

export default function PublicTrainersPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAuthed = !!user?.accessToken;

  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [recommended, setRecommended] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [minRating, setMinRating] = useState<number>(0);
  const [intensityRange, setIntensityRange] = useState<{ min: number; max: number }>({ min: 1, max: 5 });
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'name' | 'price-low' | 'price-high'>(isAuthed ? 'recommended' : 'rating');

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const data = await trainerApi.getAll();
        setAllTrainers(data);

        // Compute price ceiling from data
        const priceCeil = Math.max(50, ...data.map(t => t.pricePerSession || 0));
        setMaxPrice(Math.ceil(priceCeil / 10) * 10);
      } catch (err) {
        console.error("Failed to fetch trainers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setRecommended([]);
      setSortBy('rating');
      return;
    }
    setSortBy('recommended');
    setRecLoading(true);
    trainerApi.getRecommended(user.accessToken)
      .then(data => setRecommended(data))
      .catch(err => console.error('Failed to fetch recommendations', err))
      .finally(() => setRecLoading(false));
  }, [user?.accessToken, isAuthed]);

  // Build a fast lookup of match metadata from recommendations
  const matchById = useMemo(() => {
    const m = new Map<number, Trainer>();
    recommended.forEach(t => m.set(t.id, t));
    return m;
  }, [recommended]);

  const filtered = useMemo(() => {
    let list = [...allTrainers].map(t => {
      const match = matchById.get(t.id);
      if (match) {
        return { ...t, matchScore: match.matchScore, matchReasons: match.matchReasons, matchConfidence: match.matchConfidence };
      }
      return t;
    });

    if (selectedFocus.length > 0) {
      list = list.filter(t => t.focus?.some(f => selectedFocus.includes(f)));
    }
    if (selectedLocations.length > 0) {
      list = list.filter(t => t.location && selectedLocations.includes(t.location));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.bio?.toLowerCase().includes(q) ||
        t.focus?.some(f => f.toLowerCase().includes(q))
      );
    }
    list = list.filter(t => (t.pricePerSession || 0) <= maxPrice);
    list = list.filter(t => (t.rating || 0) >= minRating);
    list = list.filter(t => {
      const i = t.intensity ?? 3;
      return i >= intensityRange.min && i <= intensityRange.max;
    });

    switch (sortBy) {
      case 'recommended':
        list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        list.sort((a, b) => (a.pricePerSession || 0) - (b.pricePerSession || 0));
        break;
      case 'price-high':
        list.sort((a, b) => (b.pricePerSession || 0) - (a.pricePerSession || 0));
        break;
    }
    return list;
  }, [allTrainers, matchById, selectedFocus, selectedLocations, searchQuery, maxPrice, minRating, intensityRange, sortBy]);

  const toggleFocus = (value: string) =>
    setSelectedFocus(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
  const toggleLocation = (value: string) =>
    setSelectedLocations(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);

  const activeFilterCount =
    selectedFocus.length +
    selectedLocations.length +
    (searchQuery.trim() ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (intensityRange.min > 1 || intensityRange.max < 5 ? 1 : 0);

  const clearFilters = () => {
    setSelectedFocus([]);
    setSelectedLocations([]);
    setSearchQuery('');
    setMinRating(0);
    setIntensityRange({ min: 1, max: 5 });
    const priceCeil = Math.max(50, ...allTrainers.map(t => t.pricePerSession || 0));
    setMaxPrice(Math.ceil(priceCeil / 10) * 10);
  };

  // Top picks (recommendations) banner
  const topPicks = recommended.slice(0, 3);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-32 flex-1 w-full">
        <section className="mb-10 text-center md:text-left">
          <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 block">The Directory</span>
          <h1 className="text-3xl md:text-4xl font-bold text-warm-dark tracking-tight mb-3">Elite Professionals</h1>
          <p className="text-warm-gray text-base max-w-2xl">Connect with world-class trainers meticulously curated for your transformation.</p>
        </section>

        {/* Recommendations banner — only when authed */}
        {isAuthed && topPicks.length > 0 && (
          <section className="mb-8 bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/15 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-warm-dark">Your Top Matches</h2>
                  <p className="text-xs text-warm-gray">Personalized to your goals and intensity.</p>
                </div>
              </div>
              <button
                onClick={() => setSortBy('recommended')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === 'recommended'
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                {sortBy === 'recommended' ? 'Sorted by Match' : 'Sort by Match'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topPicks.map(t => (
                <Link
                  key={t.id}
                  href={`/trainers/${t.id}`}
                  className="group bg-white rounded-xl p-3 border border-cream-darker hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                        {t.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-warm-dark truncate group-hover:text-primary transition-colors">{t.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-12 h-1 bg-cream-darker rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${t.matchConfidence || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-primary">{t.matchConfidence}% match</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search + Filter Toolbar */}
        <section className="bg-white rounded-2xl border border-cream-darker p-5 sm:p-6 mb-8 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search by name, specialty, or focus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-cream border border-cream-darker rounded-xl text-sm text-warm-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-cream border border-cream-darker rounded-xl text-sm text-warm-dark appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:w-52"
            >
              {isAuthed && <option value="recommended">Best Match</option>}
              <option value="rating">Top Rated</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Max Price</label>
                <span className="text-xs font-bold text-warm-dark">£{maxPrice}/session</span>
              </div>
              <input
                type="range"
                min={20}
                max={Math.max(200, maxPrice)}
                step={5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-1.5 bg-cream-dark rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Min Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Min Rating</label>
                <span className="text-xs font-bold text-warm-dark flex items-center gap-1">{minRating || 'Any'} {minRating > 0 && <span className="text-amber-400">★</span>}</span>
              </div>
              <div className="flex gap-1">
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      minRating === r ? 'bg-primary text-white' : 'bg-cream text-warm-gray hover:text-warm-dark'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">Intensity</label>
                <span className="text-xs font-bold text-warm-dark">Lvl {intensityRange.min}–{intensityRange.max}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => {
                  const active = i >= intensityRange.min && i <= intensityRange.max;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        // Click to set as upper bound; shift to set lower
                        setIntensityRange(prev => {
                          if (prev.min === i && prev.max === i) return { min: 1, max: 5 };
                          return { min: 1, max: i };
                        });
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        active ? 'bg-primary text-white' : 'bg-cream text-warm-gray hover:text-warm-dark'
                      }`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map(loc => {
                const active = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    onClick={() => toggleLocation(loc)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-primary border-primary text-white'
                        : 'bg-cream border-cream-darker text-warm-gray hover:border-primary/30 hover:text-warm-dark'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">Training Focus</label>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-warm-gray hover:text-primary transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all ({activeFilterCount})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAINING_FOCUS.map(f => {
                const active = selectedFocus.includes(f.value);
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleFocus(f.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      active
                        ? 'bg-primary border-primary text-white'
                        : 'bg-cream border-cream-darker text-warm-gray hover:border-primary/30 hover:text-warm-dark'
                    }`}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-warm-gray">
              <span className="font-semibold text-warm-dark">{filtered.length}</span> {filtered.length === 1 ? 'trainer' : 'trainers'} found
              {sortBy === 'recommended' && recLoading && ' · loading matches…'}
            </p>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             [1,2,3,4,5,6].map(i => (
                <div key={i} className="h-[460px] bg-cream-dark rounded-2xl animate-pulse border border-cream-darker" />
             ))
          ) : filtered.length > 0 ? (
            filtered.map((trainer) => (
              <div key={trainer.id} className="relative">
                {sortBy === 'recommended' && trainer.matchConfidence !== undefined && (
                  <div className="absolute top-2 left-2 z-10 bg-primary text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> {trainer.matchConfidence}%
                  </div>
                )}
                <TrainerCard trainer={trainer} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
                <p className="text-warm-gray text-lg">No trainers match your filters.</p>
                <button onClick={clearFilters} className="mt-3 text-primary text-sm font-semibold hover:underline">
                  Clear filters
                </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
