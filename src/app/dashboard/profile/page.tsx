"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from 'react';
import { onboardingApi, bookingApi } from "@/lib/api";
import { toast } from "sonner";

export default function UserProfilePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "Male",
    height: "",
    weight: "",
    fitnessGoal: "Muscle Building & Strength",
    imageUrl: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingIncomplete, setIsOnboardingIncomplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

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
      const [onboardingData, bookingsData] = await Promise.all([
        onboardingApi.getMe(user.accessToken),
        bookingApi.getMyBookings(user.accessToken)
      ]);

      const isComplete = !!(onboardingData && onboardingData.age && onboardingData.height && onboardingData.weight);
      setIsOnboardingIncomplete(!onboardingData || !isComplete);

      setFormData({
        fullName: user.name || onboardingData.fullName || "",
        email: user.email || onboardingData.email || "",
        age: onboardingData.age?.toString() || "",
        gender: "Male",
        height: onboardingData.height?.toString() || "",
        weight: onboardingData.weight?.toString() || "",
        fitnessGoal: onboardingData.goal || "Muscle Building & Strength",
        imageUrl: onboardingData.imageUrl || ""
      });
      setSessionCount(bookingsData.length);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      setIsOnboardingIncomplete(true);
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
      const res = await onboardingApi.uploadProfileImage(
        file,
        (percent) => setUploadProgress(percent),
        user.accessToken
      );
      setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
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
      await onboardingApi.save({
        fullName: formData.fullName,
        goal: formData.fitnessGoal,
        age: parseInt(formData.age) || 0,
        height: parseInt(formData.height) || 0,
        weight: parseInt(formData.weight) || 0,
        activityLevel: "Moderate",
        experienceLevel: "Intermediate",
        healthConditions: [],
        workoutType: "Gym",
        dietPreference: "None"
      }, user.accessToken);

      setIsOnboardingIncomplete(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      <DashboardNavbar />

      <main className="page-container">
        {isOnboardingIncomplete && (
          <div className="mb-8 bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-warm-dark mb-0.5">Finish Your Profile Setup</h3>
                <p className="text-warm-gray text-sm">Please provide your health metrics to get an accurate fitness plan.</p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('age')?.focus()}
              className="btn-primary text-sm"
            >
              Complete Now
            </button>
          </div>
        )}

        <div className="mb-10">
          <h1 className="section-header">My <span className="text-primary">Profile</span></h1>
          <p className="text-warm-gray">Manage your personal metrics and fitness trajectory.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Profile Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-cream-darker shadow-sm overflow-hidden sticky top-24">
              {/* Cover gradient */}
              <div className="h-24 bg-gradient-to-br from-primary to-primary-light relative" />

              <div className="px-6 pb-8 relative text-center">
                {/* Avatar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-[3px] border-white overflow-hidden bg-cream-dark shadow-md -mt-10 mb-4 mx-auto relative group cursor-pointer transition-transform hover:scale-105 duration-300"
                >
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="User Avatar"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`}>
                      {formData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
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

                {/* Name & Email */}
                <h2 className="text-lg font-bold text-warm-dark">{formData.fullName}</h2>
                <p className="text-xs text-warm-gray mt-0.5 mb-5">{formData.email}</p>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{sessionCount}</p>
                    <p className="text-[10px] text-warm-gray">Sessions</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{formData.weight || '--'}</p>
                    <p className="text-[10px] text-warm-gray">Weight (kg)</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3">
                    <p className="text-lg font-bold text-primary">{formData.height || '--'}</p>
                    <p className="text-[10px] text-warm-gray">Height (cm)</p>
                  </div>
                </div>

                {/* Info Items */}
                <div className="space-y-3 pt-5 border-t border-cream-darker text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Goal</span>
                    <span className="text-warm-dark font-medium text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg">{formData.fitnessGoal?.split('&')[0]?.trim() || 'Fitness'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Age</span>
                    <span className="text-warm-dark font-medium">{formData.age || '--'} years</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">Gender</span>
                    <span className="text-warm-dark font-medium">{formData.gender}</span>
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
                Account Information
              </h2>

              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-premium w-full"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="input-premium w-full opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-warm-gray ml-1">Contact support to change your email.</p>
                </div>

                <div className="pt-8 mt-4 border-t border-cream-darker">
                  <h3 className="text-lg font-bold text-warm-dark mb-6 flex items-center gap-3">
                    <span className="w-1 h-5 bg-primary/40 rounded-full"></span>
                    Physical Metrics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="age" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Age</label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="input-premium w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="gender" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="input-premium w-full appearance-none cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="height" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Height (cm)</label>
                      <input
                        type="number"
                        id="height"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="input-premium w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="weight" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Weight (kg)</label>
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="input-premium w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-4 border-t border-cream-darker">
                  <h3 className="text-lg font-bold text-warm-dark mb-6 flex items-center gap-3">
                    <span className="w-1 h-5 bg-primary/40 rounded-full"></span>
                    Fitness Strategy
                  </h3>

                  <div className="space-y-2">
                    <label htmlFor="fitnessGoal" className="block text-xs font-semibold text-primary uppercase tracking-wider ml-1">Primary Objective</label>
                    <select
                      id="fitnessGoal"
                      name="fitnessGoal"
                      value={formData.fitnessGoal}
                      onChange={handleChange}
                      className="input-premium w-full appearance-none cursor-pointer"
                    >
                      <option value="Weight Loss & Toning">Weight Loss & Toning</option>
                      <option value="Muscle Building & Strength">Muscle Building & Strength</option>
                      <option value="Endurance & Cardio">Endurance & Cardio</option>
                      <option value="Flexibility & Mobility">Flexibility & Mobility</option>
                      <option value="General Health & Wellness">General Health & Wellness</option>
                      <option value="Event Preparation (e.g., Marathon)">Event Preparation (e.g., Marathon)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-8 mt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-cream-darker">
                  <button type="button" className="btn-secondary w-full sm:w-auto">
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
