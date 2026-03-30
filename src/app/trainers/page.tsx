"use client";

import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrainerCard from "@/components/TrainerCard";
import { trainerApi } from "@/lib/api";
import { TRAINING_FOCUS } from "@/lib/constants";
import { Trainer } from "@/types";

export default function PublicTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price-low' | 'price-high'>('rating');

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const data = await trainerApi.getAll();
        setAllTrainers(data);
        setTrainers(data);
      } catch (err) {
        console.error("Failed to fetch trainers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  // Filter and sort whenever criteria change
  useEffect(() => {
    let filtered = [...allTrainers];

    // Focus filter
    if (selectedFocus.length > 0) {
      filtered = filtered.filter(t =>
        t.focus?.some(f => selectedFocus.includes(f))
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.bio?.toLowerCase().includes(q) ||
        t.focus?.some(f => f.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.pricePerSession || 0) - (b.pricePerSession || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.pricePerSession || 0) - (a.pricePerSession || 0));
        break;
    }

    setTrainers(filtered);
  }, [selectedFocus, allTrainers, searchQuery, sortBy]);

  const toggleFocus = (value: string) => {
    setSelectedFocus(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSelectedFocus([]);
    setSearchQuery('');
    setSortBy('rating');
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-32 flex-1 w-full">
        <section className="mb-14 text-center md:text-left">
          <div className="mb-10">
            <span className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 block">The Directory</span>
            <h1 className="text-4xl md:text-5xl font-bold text-warm-dark tracking-tight mb-4">Elite Professionals</h1>
            <p className="text-warm-gray text-lg max-w-2xl">Connect with world-class trainers meticulously curated for your transformation.</p>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search by name, specialty, or focus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-cream-darker rounded-xl text-sm text-warm-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-cream-darker rounded-xl text-sm text-warm-dark appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:w-48"
            >
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Training Focus Pill Filters */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-cream-darker">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">Filter by Focus</label>
              {selectedFocus.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-warm-gray hover:text-primary transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {TRAINING_FOCUS.map(f => {
                const isActive = selectedFocus.includes(f.value);
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleFocus(f.value)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      border flex items-center gap-2 active:scale-95
                      ${isActive
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-cream border-cream-darker text-warm-gray hover:border-primary/30 hover:text-warm-dark'
                      }
                    `}
                  >
                    <span className="text-base">{f.icon}</span>
                    {f.label}
                  </button>
                );
              })}
            </div>
            {selectedFocus.length > 0 && (
              <p className="text-warm-gray text-xs mt-3">
                Showing trainers matching {selectedFocus.length} {selectedFocus.length === 1 ? 'focus' : 'focus areas'}
              </p>
            )}
          </div>
        </section>

        {!loading && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warm-gray">{trainers.length} {trainers.length === 1 ? 'trainer' : 'trainers'} found</p>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
             [1,2,3,4,5,6].map(i => (
                <div key={i} className="h-[500px] bg-cream-dark rounded-2xl animate-pulse border border-cream-darker" />
             ))
          ) : trainers.length > 0 ? (
            trainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center">
                <p className="text-warm-gray text-xl">No trainers match your filters.</p>
                <button onClick={clearFilters} className="mt-4 text-primary text-sm font-semibold hover:underline">
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
