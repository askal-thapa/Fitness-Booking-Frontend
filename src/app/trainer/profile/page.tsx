"use client";

import TrainerNavbar from "@/components/TrainerNavbar";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from 'react';
import { trainerApi, bookingApi } from "@/lib/api";
import { TRAINING_FOCUS } from "@/lib/constants";
import { Trainer } from "@/types";
import { toast } from "sonner";

const LOCATIONS = ['Gym', 'Home', 'Virtual'];

export default function TrainerProfilePage() {
  const { data: session } = useSession();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [formData, setFormData] = useState({
    specialty: '',
    bio: '',
    pricePerSession: 0,
    intensity: 3,
    focus: [] as string[],
    location: 'Gym',
    imageUrl: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const user = session?.user as any;

  useEffect(() => {
    if (user?.accessToken) {
      fetchData();
    }
  }, [user?.accessToken]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [trainerData, sessionsData] = await Promise.all([
        trainerApi.getMe(user.accessToken),
        bookingApi.getMySessions(user.accessToken),
      ]);

      setTrainer(trainerData);
      setIsProfileIncomplete(
        !trainerData.bio?.trim() ||
        !trainerData.specialty?.trim() ||
        (trainerData.focus || []).length === 0
      );

      setFormData({
        specialty: trainerData.specialty || '',
        bio: trainerData.bio || '',
        pricePerSession: trainerData.pricePerSession || 0,
        intensity: trainerData.intensity || 3,
        focus: trainerData.focus || [],
        location: trainerData.location || 'Gym',
        imageUrl: trainerData.imageUrl || '',
      });

      setCompletedCount(sessionsData.filter(s => s.status === 'completed').length);
    } catch (err) {
      console.error("Failed to fetch trainer profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.accessToken) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const res = await trainerApi.uploadProfileImage(
        file,
        (percent) => setUploadProgress(percent),
        user.accessToken
      );
      setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
      toast.success("Profile photo updated.");
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.accessToken) return;

    setIsSaving(true);
    try {
      // imageUrl is uploaded via the dedicated /trainers/me/image endpoint
      const { imageUrl: _omitted, ...payload } = formData;
      await trainerApi.updateProfile(payload, user.accessToken);
      await fetchData();
      toast.success("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to update profile: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const toggleFocus = (value: string) => {
    setFormData(prev => ({
      ...prev,
      focus: prev.focus.includes(value)
        ? prev.focus.filter(f => f !== value)
        : [...prev.focus, value],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <TrainerNavbar />

      <main className="page-container">
        {isProfileIncomplete && (
          <div className="mb-8 bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-warm-dark mb-0.5">Finish Your Profile Setup</h3>
                <p className="text-warm-gray text-sm">Set your bio, specialty, and focus areas to become visible to clients.</p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('specialty')?.focus()}
              className="btn-primary text-sm"
            >
              Complete Now
            </button>
          </div>
        )}

        <div className="mb-10">
          <h1 className="section-header">Trainer <span className="text-primary">Profile</span></h1>
          <p className="text-warm-gray">Manage how clients discover and connect with you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Profile Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-cream-darker shadow-sm overflow-hidden sticky top-24">
              <div className="h-24 bg-gradient-to-br from-primary to-primary-light relative" />

              <div className="px-6 pb-8 relative text-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-[3px] border-white overflow-hidden bg-cream-dark shadow-md -mt-10 mb-4 mx-auto relative group cursor-pointer transition-transform hover:scale-105 duration-300"
                >
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Trainer Avatar"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`}>
                      {trainer?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-warm-dark/50 flex flex-col items-center justify-center rounded-full transition-opacity duration-300 ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span className="text-[9px] font-semibold text-white">{uploadProgress}%</span>
                      </div>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                <h2 className="text-lg font-bold text-warm-dark">{trainer?.name}</h2>
                <p className="text-xs text-warm-gray mt-0.5 mb-5">{user?.email}</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{completedCount}</p>
                    <p className="text-[10px] text-warm-gray">Sessions</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary flex items-baseline justify-center gap-0.5">
                      {(trainer?.rating || 0).toFixed(1)}
                      <span className="text-amber-400 text-xs">★</span>
                    </p>
                    <p className="text-[10px] text-warm-gray">Rating</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">£{formData.pricePerSession || 0}</p>
                    <p className="text-[10px] text-warm-gray">Per Hour</p>
                  </div>
                </div>

                <div className="space-y-3 pt-5 border-t border-cream-darker text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Location</span>
                    <span className="text-warm-dark font-medium text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg">{formData.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Intensity</span>
                    <span className="text-warm-dark font-medium">Level {formData.intensity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Focus Areas</span>
                    <span className="text-warm-dark font-medium">{formData.focus.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="card-premium">
              <h2 className="text-xl font-bold text-warm-dark mb-8 pb-4 border-b border-cream-darker flex items-center gap-3">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Public Profile
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="specialty" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Specialty Headline</label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    placeholder="e.g. Performance & Conditioning Coach"
                    className="input-premium w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Bio & Philosophy</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your training methodology, certifications, and the kind of clients you love working with."
                    className="input-premium w-full resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-8 mt-4 border-t border-cream-darker">
                  <h3 className="text-lg font-bold text-warm-dark mb-6 flex items-center gap-3">
                    <span className="w-1 h-5 bg-primary/40 rounded-full"></span>
                    Pricing & Style
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="pricePerSession" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Hourly Rate (£)</label>
                      <input
                        type="number"
                        id="pricePerSession"
                        name="pricePerSession"
                        value={formData.pricePerSession || ''}
                        onChange={handleChange}
                        min={0}
                        className="input-premium w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="intensity" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Intensity Level</label>
                      <select
                        id="intensity"
                        name="intensity"
                        value={formData.intensity}
                        onChange={handleChange}
                        className="input-premium w-full appearance-none cursor-pointer"
                      >
                        {[1,2,3,4,5].map(i => (
                          <option key={i} value={i}>
                            Level {i}{i === 1 ? ' — Light' : i === 3 ? ' — Intense' : i === 5 ? ' — Max' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Training Location</label>
                    <div className="grid grid-cols-3 gap-3">
                      {LOCATIONS.map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, location: loc }))}
                          className={`py-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border-2 ${
                            formData.location === loc
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-cream-dark border-transparent text-warm-gray hover:border-cream-darker hover:text-warm-dark'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-4 border-t border-cream-darker">
                  <h3 className="text-lg font-bold text-warm-dark mb-6 flex items-center gap-3">
                    <span className="w-1 h-5 bg-primary/40 rounded-full"></span>
                    Training Focus
                  </h3>
                  <p className="text-xs text-warm-gray mb-4 ml-1">Select the areas you specialize in. These power our matchmaking with clients.</p>

                  <div className="flex flex-wrap gap-3">
                    {TRAINING_FOCUS.map(f => {
                      const active = formData.focus.includes(f.value);
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => toggleFocus(f.value)}
                          className={`px-5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border-2 ${
                            active
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-cream-dark border-transparent text-warm-gray hover:border-cream-darker hover:text-warm-dark'
                          }`}
                        >
                          <span className="text-base">{f.icon}</span> {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-8 mt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-cream-darker">
                  <button
                    type="button"
                    onClick={() => fetchData()}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary w-full sm:min-w-[200px] flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
