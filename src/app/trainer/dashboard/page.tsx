"use client";

import TrainerNavbar from "@/components/TrainerNavbar";
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { useSession } from "next-auth/react";
import { bookingApi, trainerApi } from "@/lib/api";
import { toast } from "sonner";
import { Booking, Trainer, TrainerAvailability } from "@/types";
import { TRAINING_FOCUS } from "@/lib/constants";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerDashboardPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [showWarning, setShowWarning] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing
  const [localAvailability, setLocalAvailability] = useState<Partial<TrainerAvailability>[]>([]);
  const [profileData, setProfileData] = useState({
    specialty: '',
    bio: '',
    pricePerSession: 0,
    intensity: 3,
    focus: [] as string[],
    location: 'Gym',
    imageUrl: '',
  });

  const user = session?.user as any;

  const fetchData = async () => {
    if (!user?.accessToken) return;
    try {
      setLoading(true);
      const [sessionsData, trainerData] = await Promise.all([
        bookingApi.getMySessions(user.accessToken),
        trainerApi.getMe(user.accessToken)
      ]);
      setSessions(sessionsData);
      setTrainer(trainerData);

      setProfileData({
        specialty: trainerData.specialty || '',
        bio: trainerData.bio || '',
        pricePerSession: trainerData.pricePerSession || 0,
        intensity: trainerData.intensity || 3,
        focus: trainerData.focus || [],
        location: trainerData.location || 'Gym',
        imageUrl: trainerData.imageUrl || '',
      });

      // Initialize local availability
      const initialAvailability = DAYS.map((_, index) => {
        const existing = trainerData.availability?.find(a => a.dayOfWeek === index);
        return existing || { dayOfWeek: index, startTime: '08:00', endTime: '20:00', isClosed: index === 0 || index === 6 };
      });
      setLocalAvailability(initialAvailability);

    } catch (err) {
      console.error("Failed to fetch trainer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.accessToken]);

  const toggleArrayItem = (field: 'focus', value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(i => i !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const handleStatusUpdate = async (id: number, status: 'confirmed' | 'cancelled') => {
    if (status === 'cancelled') {
        setActiveBookingId(id);
        setShowCancelModal(true);
        return;
    }

    try {
      await bookingApi.updateStatus(id, status, undefined, user.accessToken);
      toast.success(`Session ${status === 'confirmed' ? 'accepted' : 'cancelled'} successfully`);
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${status} session: ` + (err as Error).message);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId || !user?.accessToken) return;

    try {
      await bookingApi.updateStatus(activeBookingId, 'cancelled', cancelReason, user.accessToken);
      toast.success("Session declined successfully");
      setShowCancelModal(false);
      setCancelReason('');
      fetchData();
    } catch (err) {
      toast.error("Failed to decline session: " + (err as Error).message);
    }
  };

  const handleToggleDay = (index: number) => {
    setLocalAvailability(prev => prev.map(a =>
      a.dayOfWeek === index ? { ...a, isClosed: !a.isClosed } : a
    ));
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setLocalAvailability(prev => prev.map(a =>
      a.dayOfWeek === index ? { ...a, [field]: value } : a
    ));
  };

  const handleSaveAvailability = async () => {
    if (!user?.accessToken) return;
    try {
      setIsSaving(true);
      await trainerApi.updateAvailability(localAvailability, user.accessToken);
      await fetchData();
      toast.success("Calendar updated successfully");
      setShowAvailabilityModal(false);
    } catch (err) {
      toast.error("Failed to update availability: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.accessToken) return;
    try {
      setIsSaving(true);

      // Artificial delay for better "updating feel" as requested
      const timer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 100);

      await trainerApi.updateProfile(profileData, user.accessToken);

      clearInterval(timer);
      setUploadProgress(100);

      toast.success("Profile updated successfully");

      setTimeout(() => {
        fetchData();
        setShowProfileModal(false);
        setModalStep(1);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      toast.error("Failed to update profile: " + (err as Error).message);
    } finally {
      setIsSaving(false);
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
      setProfileData(prev => ({ ...prev, imageUrl: res.imageUrl }));
      toast.success("Profile image updated");
    } catch (err) {
      toast.error("Failed to upload image: " + (err as Error).message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Improved profile completion check: ensuring all core categorization and narrative fields are populated
  const isProfileIncomplete =
    !trainer?.bio?.trim() ||
    !trainer?.specialty?.trim() ||
    (trainer?.focus || []).length === 0;

  const upcomingSessions = sessions.filter(s => s.status === 'pending' || s.status === 'confirmed');
  const uniqueClients = new Set(sessions.map(s => s.userName)).size;

  return (
    <div className="min-h-screen bg-cream">
      <TrainerNavbar />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Visibility Alert */}
        {isProfileIncomplete && showWarning && (
          <div className="bg-red-500 text-white p-8 rounded-2xl mb-12 flex flex-col md:flex-row items-center justify-between shadow-md border-b-8 border-red-700 animate-in slide-in-from-top-6 duration-700">
             <div className="flex items-center gap-8 mb-6 md:mb-0">
                <div className="bg-white/20 p-4 rounded-2xl">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight mb-1 leading-none">Visibility Restricted</h2>
                    <p className="text-sm font-semibold text-white/90">Complete your focus and bio to become visible to clients.</p>
                </div>
             </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
                <button onClick={() => setShowProfileModal(true)} className="flex-1 md:flex-none bg-white text-red-600 px-10 py-4 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-md active:scale-95 uppercase tracking-wider">Setup Profile</button>
                <button onClick={() => setShowWarning(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
          <div>
            <h1 className="text-6xl font-bold text-warm-dark mb-4 tracking-tighter leading-none flex items-center gap-4">
              Control <span className="text-primary">Center</span>
            </h1>
            <p className="text-warm-gray font-medium text-xl tracking-tight">Manage your professional presence and client roster.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowProfileModal(true)} className="px-10 py-5 bg-cream-dark border border-cream-darker text-warm-dark text-sm font-semibold rounded-2xl hover:bg-cream-dark transition-all active:scale-95 uppercase tracking-wider">Edit Profile</button>
            <button onClick={() => setShowAvailabilityModal(true)} className="px-10 py-5 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary-hover transition-all shadow-sm active:scale-95 uppercase tracking-wider">Calendar</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { label: 'Total Sessions', value: sessions.length, color: 'warm-dark' },
                { label: 'Active Clients', value: uniqueClients, color: 'warm-dark' },
                { label: 'Session Rate', value: `£${trainer?.pricePerSession || 0}`, color: 'primary' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-10 rounded-2xl border border-cream-darker flex flex-col justify-between group hover:bg-cream-dark transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream-dark rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-8 relative z-10">{stat.label}</p>
                  <h3 className={`text-6xl font-bold tracking-tighter relative z-10 ${stat.color === 'primary' ? 'text-primary' : 'text-warm-dark'}`}>{stat.value}</h3>
                </div>
              ))}
            </section>

            <section className="bg-white p-12 rounded-2xl border border-cream-darker">
              <div className="flex justify-between items-center mb-12 border-b border-cream-darker pb-10">
                <h2 className="text-4xl font-bold text-warm-dark tracking-tighter">Agenda <span className="text-primary">Overview</span></h2>
              </div>
              <div className="space-y-10">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-10 bg-cream rounded-2xl border border-cream-darker hover:border-primary/30 transition-all group relative">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl border border-primary/15 uppercase shadow-sm">
                          {session.userName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                             <h4 className="text-2xl font-bold text-warm-dark tracking-tight">{session.userName}</h4>
                             {session.status === 'confirmed' ? (
                               <span className="px-4 py-1.5 bg-green-500/10 text-green-600 text-[10px] font-semibold rounded-full uppercase tracking-wider border border-green-500/20 shadow-sm">Confirmed</span>
                             ) : (
                               <span className="px-4 py-1.5 bg-amber-500/10 text-amber-600 text-[10px] font-semibold rounded-full uppercase tracking-wider border border-amber-500/20 shadow-sm animate-pulse">Request</span>
                             )}
                          </div>
                          <div className="flex items-center gap-8 text-[11px] font-semibold text-warm-gray">
                            <span className="flex items-center gap-3"><svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{session.date}</span>
                            <span className="flex items-center gap-3"><svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{session.timeSlot}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-8 sm:mt-0">
                        {session.status === 'pending' && (
                          <button onClick={() => handleStatusUpdate(session.id, 'confirmed')} className="flex-1 py-4 px-10 bg-primary text-white text-[10px] font-semibold rounded-2xl hover:bg-primary-hover transition-all shadow-sm uppercase tracking-wider active:scale-95">Accept</button>
                        )}
                        <button onClick={() => handleStatusUpdate(session.id, 'cancelled')} className="flex-1 py-4 px-10 bg-cream-dark border border-cream-darker text-red-500 text-[10px] font-semibold rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider active:scale-95">Decline</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-cream-darker rounded-2xl">
                    <p className="text-warm-gray text-4xl font-medium tracking-tight">Your agenda is currently vacant.</p>
                  </div>
                )}
              </div>
            </section>
          </div>


          <div className="space-y-8">
            <section className="bg-white text-warm-dark p-10 rounded-2xl shadow-sm relative overflow-hidden group border border-cream-darker">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[64px] -mr-24 -mt-24 group-hover:bg-primary/20 transition-all duration-700" />
               <div className="relative z-10">
                 <div className="w-24 h-24 rounded-2xl bg-cream-dark overflow-hidden mb-8 border-2 border-cream-darker p-1.5 shadow-sm">
                   <img src={trainer?.imageUrl || ""} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                 </div>
                 <h3 className="text-4xl font-bold mb-1 tracking-tight">{trainer?.name}</h3>
                 <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-8">{trainer?.specialty}</p>

                 <div className="space-y-6 mb-10">
                   <div className="p-6 bg-cream-dark rounded-2xl border border-cream-darker">
                      <p className="text-[10px] font-semibold text-warm-gray uppercase tracking-wider mb-4">Core Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {trainer?.focus?.map(s => (
                          <span key={s} className="px-4 py-2 bg-cream text-[10px] font-semibold rounded-xl text-warm-dark">{s}</span>
                        )) || <span className="text-warm-gray text-xs">Undefined</span>}
                      </div>
                   </div>
                   <div className="p-6 bg-cream-dark rounded-2xl border border-cream-darker">
                      <p className="text-[10px] font-semibold text-warm-gray uppercase tracking-wider mb-4">Primary Focus</p>
                      <div className="flex flex-wrap gap-2">
                        {trainer?.focus?.map(f => (
                          <span key={f} className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-semibold rounded-xl">{f}</span>
                        )) || <span className="text-warm-gray text-xs">Undefined</span>}
                      </div>
                   </div>
                 </div>

                 <button onClick={() => setShowProfileModal(true)} className="w-full py-5 bg-cream-dark text-warm-dark text-[11px] font-semibold rounded-2xl hover:bg-cream transition-all border-2 border-cream-darker uppercase tracking-wider">Update Profile</button>
               </div>
            </section>

            <section className="bg-white p-10 rounded-2xl shadow-sm border border-cream-darker">
               <h3 className="text-2xl font-bold text-warm-dark mb-8 flex items-center justify-between tracking-tight">
                 Schedule
                 <button onClick={() => setShowAvailabilityModal(true)} className="text-primary p-3 hover:bg-primary/5 rounded-2xl transition-all active:scale-95"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
               </h3>
               <div className="space-y-4">
                 {DAYS.map((day, idx) => {
                   const av = trainer?.availability?.find(a => a.dayOfWeek === idx);
                   return (
                     <div key={day} className="flex justify-between items-center text-[11px] font-semibold group">
                        <span className="text-warm-gray group-hover:text-warm-dark transition-colors">{day}</span>
                        {av && !av.isClosed ? (
                          <span className="text-warm-dark px-3 py-1 bg-cream rounded-lg">{av.startTime.replace(':00','')} - {av.endTime.replace(':00','')}</span>
                        ) : (
                          <span className="text-red-300 uppercase tracking-wider opacity-40">Off Duty</span>
                        )}
                     </div>
                   )
                 })}
               </div>
            </section>
          </div>
        </div>
      </main>
      {/* MULTI-STEP PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-md max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-cream-darker">
            {/* Progress Bar */}
            {(isSaving || isUploading) && (
              <div className="h-1.5 w-full bg-cream-dark relative overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out flex items-center justify-end pr-2 overflow-visible"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="text-[8px] font-bold text-white absolute translate-x-full pr-1">{uploadProgress}%</div>
                </div>
              </div>
            )}

            <div className="p-10 border-b border-cream-darker flex justify-between items-center bg-cream">
              <div className="flex items-center gap-8">
                 {[1, 2, 3].map(s => (
                   <div key={s} className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[12px] font-bold transition-all duration-500 ${modalStep === s ? 'bg-primary text-white scale-110 shadow-sm' : modalStep > s ? 'bg-green-500 text-white shadow-sm' : 'bg-cream-dark text-warm-gray'}`}>
                        {modalStep > s ? '✓' : s}
                      </div>
                      {s < 3 && <div className={`w-12 h-1 rounded-full ${modalStep > s ? 'bg-green-500' : 'bg-cream-dark'}`} />}
                   </div>
                 ))}
              </div>
              <button
                disabled={isSaving || isUploading}
                onClick={() => { setShowProfileModal(false); setModalStep(1); }}
                className="p-4 hover:bg-cream-dark rounded-2xl transition-all disabled:opacity-20 group"
              >
                <svg className="w-6 h-6 text-warm-gray group-hover:text-warm-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 scroll-smooth">
               {modalStep === 1 && (
                 <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-3">
                       <h2 className="text-5xl font-bold text-warm-dark tracking-tighter">Aesthetics</h2>
                       <p className="text-warm-gray font-medium text-xl tracking-tight leading-none">Visuals and narrative define your presence.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                      {/* Left: Image Upload Area */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative group">
                          <div
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={`
                              relative w-40 h-40 rounded-2xl overflow-hidden cursor-pointer border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center shadow-sm
                              ${isUploading ? 'border-primary bg-primary/5' : profileData.imageUrl ? 'border-transparent' : 'border-cream-darker hover:border-primary hover:bg-primary/5'}
                            `}
                          >
                            {profileData.imageUrl ? (
                              <>
                                <img src={profileData.imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute inset-0 bg-warm-dark/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-warm-gray group-hover:text-primary transition-colors text-center p-6">
                                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                 <p className="text-[10px] font-semibold uppercase tracking-wider leading-tight">Photo</p>
                              </div>
                            )}

                            {isUploading && (
                               <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center p-6">
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">{uploadProgress}%</p>
                                  <div className="w-full h-1.5 bg-cream-dark rounded-full overflow-hidden">
                                     <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                               </div>
                            )}
                          </div>

                          {/* Pencil Icon Badge */}
                          <div className="absolute -bottom-2 -right-2 bg-primary p-3.5 rounded-2xl text-white shadow-sm border-4 border-white group-hover:scale-110 transition-all duration-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </div>
                        </div>
                        <label className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-8 opacity-60">Profile Photo</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      </div>

                      {/* Right: Inputs Area */}
                      <div className="flex-1 space-y-10 w-full pt-2">
                        <div className="space-y-4">
                          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-2">Specialty Headline</label>
                          <input type="text" value={profileData.specialty} onChange={(e) => setProfileData({...profileData, specialty: e.target.value})} placeholder="e.g. Performance Coach" className="w-full bg-cream border border-cream-darker focus:border-primary focus:bg-white outline-none text-warm-dark font-semibold p-6 rounded-2xl transition-all text-xl tracking-tight" />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-2">Bio & Philosophy</label>
                          <textarea rows={5} value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} className="w-full bg-cream border border-cream-darker focus:border-primary focus:bg-white outline-none text-warm-dark font-medium p-6 rounded-2xl transition-all resize-none leading-relaxed" placeholder="Describe your training methodology..." />
                        </div>
                      </div>
                    </div>
                 </div>
               )}

               {modalStep === 2 && (
                 <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-3">
                       <h2 className="text-5xl font-bold text-warm-dark tracking-tighter">Focus Areas</h2>
                       <p className="text-warm-gray font-medium text-xl tracking-tight leading-none">Select your areas of expertise.</p>
                    </div>
                    <div className="space-y-12 pt-6">
                       <div className="space-y-8">
                          <label className="text-[12px] font-semibold text-primary uppercase tracking-wider flex items-center gap-6">
                             Training Focus
                             <div className="flex-1 h-px bg-cream-darker" />
                          </label>
                          <div className="flex flex-wrap gap-5">
                            {TRAINING_FOCUS.map(f => (
                              <button key={f.value} onClick={() => toggleArrayItem('focus', f.value)} className={`px-10 py-5 rounded-2xl text-[12px] font-semibold transition-all duration-300 flex items-center gap-4 border-2 ${profileData.focus.includes(f.value) ? 'bg-primary text-white border-primary shadow-sm -translate-y-1' : 'bg-cream-dark border-transparent text-warm-gray hover:border-cream-darker hover:text-warm-dark'}`}>
                                <span className="text-2xl">{f.icon}</span> {f.label}
                              </button>
                            ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {modalStep === 3 && (
                 <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-3">
                       <h2 className="text-5xl font-bold text-warm-dark tracking-tighter">Settings</h2>
                       <p className="text-warm-gray font-medium text-xl tracking-tight leading-none">Set your pricing and training preferences.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                       <div className="space-y-4">
                          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-2">Hourly Rate (£)</label>
                          <input type="number" value={profileData.pricePerSession} onChange={(e) => setProfileData({...profileData, pricePerSession: parseInt(e.target.value)})} className="w-full bg-cream border border-cream-darker focus:border-primary focus:bg-white outline-none text-warm-dark font-bold p-8 rounded-2xl transition-all text-3xl" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-2">Intensity Level</label>
                          <select value={profileData.intensity} onChange={(e) => setProfileData({...profileData, intensity: parseInt(e.target.value)})} className="w-full bg-cream border border-cream-darker focus:border-primary focus:bg-white outline-none text-warm-dark font-semibold p-8 rounded-2xl transition-all h-[98px] text-xl appearance-none cursor-pointer">
                             {[1,2,3,4,5].map(i => <option key={i} value={i}>Level {i} {i === 1 ? '(Light)' : i === 3 ? '(Intense)' : i === 5 ? '(Max)' : ''}</option>)}
                          </select>
                       </div>
                       <div className="space-y-8 md:col-span-2 mt-6">
                          <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-2 text-center block">Training Location</label>
                          <div className="grid grid-cols-3 gap-8">
                             {['Gym', 'Home', 'Virtual'].map(loc => (
                               <button key={loc} type="button" onClick={() => setProfileData({...profileData, location: loc})} className={`py-10 rounded-2xl text-[12px] font-semibold transition-all border-2 uppercase tracking-wider shadow-sm ${profileData.location === loc ? 'bg-primary text-white border-primary -translate-y-2' : 'bg-cream-dark border-transparent text-warm-gray hover:border-cream-darker hover:text-warm-dark'}`}>
                                 {loc}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-12 border-t border-cream-darker bg-cream flex justify-between items-center">
               {modalStep > 1 ? (
                 <button
                  disabled={isSaving || isUploading}
                  onClick={() => setModalStep(prev => prev - 1)}
                  className="px-12 py-6 text-warm-gray text-[12px] font-semibold uppercase tracking-wider hover:text-warm-dark transition-all disabled:opacity-20"
                 >
                  Back
                 </button>
               ) : <div />}

               {modalStep < 3 ? (
                 <button
                  disabled={isSaving || isUploading}
                  onClick={() => setModalStep(prev => prev + 1)}
                  className="px-16 py-6 bg-primary text-white text-[12px] font-semibold uppercase tracking-wider rounded-2xl hover:bg-primary-hover transition-all shadow-sm active:scale-95 disabled:opacity-50"
                 >
                  Next
                 </button>
               ) : (
                 <button
                  onClick={handleUpdateProfile}
                  disabled={isSaving || isUploading}
                  className="px-20 py-6 bg-primary text-white text-[12px] font-semibold uppercase tracking-wider rounded-2xl hover:bg-primary-hover transition-all shadow-sm active:scale-95 disabled:opacity-50 min-w-[280px]"
                 >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-md max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-cream-darker">
            <div className="p-12 border-b border-cream-darker flex justify-between items-center bg-cream">
               <div>
                 <h2 className="text-4xl font-bold text-warm-dark tracking-tight">Availability</h2>
                 <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mt-3 opacity-60">Set your weekly schedule</p>
               </div>
               <button onClick={() => setShowAvailabilityModal(false)} className="p-4 hover:bg-cream-dark rounded-2xl transition-all group">
                 <svg className="w-8 h-8 text-warm-gray group-hover:text-warm-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-6">
               {DAYS.map((day, index) => {
                 const avail = localAvailability.find(a => a.dayOfWeek === index);
                 const isClosed = avail?.isClosed;

                 return (
                   <div key={day} className={`flex items-center justify-between p-8 rounded-2xl border-2 transition-all duration-500 ${isClosed ? 'bg-cream border-transparent opacity-20' : 'bg-white border-cream-darker hover:border-primary/30'}`}>
                      <div className="flex items-center gap-8">
                         <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!isClosed} onChange={() => handleToggleDay(index)} className="sr-only peer" />
                            <div className="w-14 h-8 bg-cream-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                         </div>
                         <span className={`text-[12px] font-semibold ${isClosed ? 'text-warm-gray' : 'text-warm-dark'}`}>{day}</span>
                      </div>

                      {!isClosed ? (
                        <div className="flex items-center gap-6">
                           <input type="time" value={avail?.startTime} onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)} className="bg-cream border border-cream-darker text-warm-dark text-[12px] font-semibold rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-primary/20" />
                           <span className="text-[10px] font-semibold text-warm-gray">to</span>
                           <input type="time" value={avail?.endTime} onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)} className="bg-cream border border-cream-darker text-warm-dark text-[12px] font-semibold rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-primary/20" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-warm-gray mr-16">Closed</span>
                      )}
                   </div>
                 );
               })}
            </div>

            <div className="p-12 border-t border-cream-darker bg-cream flex gap-8">
               <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 py-6 text-warm-gray text-[12px] font-semibold uppercase tracking-wider hover:text-warm-dark transition-all">Cancel</button>
               <button onClick={handleSaveAvailability} disabled={isSaving} className="flex-[2] py-6 bg-primary text-white text-[12px] font-semibold uppercase tracking-wider rounded-2xl hover:bg-primary-hover transition-all shadow-sm active:scale-95 disabled:opacity-50">
                 {isSaving ? 'Saving...' : 'Save Schedule'}
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-md max-w-xl w-full animate-in zoom-in-95 duration-500 border border-cream-darker">
            <div className="p-12 border-b border-cream-darker flex justify-between items-center bg-cream">
              <h2 className="text-4xl font-bold text-warm-dark">Decline Request</h2>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="p-4 hover:bg-cream-dark rounded-2xl transition-all group"
              >
                <svg className="w-8 h-8 text-warm-gray group-hover:text-warm-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-12 space-y-10">
               <div className="space-y-4">
                  <p className="text-xl font-bold text-warm-dark tracking-tight">Reason for Declining</p>
                  <p className="text-sm font-medium text-warm-gray leading-relaxed">
                    Please provide context for the client regarding the schedule conflict or other reasons.
                  </p>
               </div>

               <div className="space-y-4">
                  <label className="text-[11px] font-semibold text-red-400 uppercase tracking-wider ml-2">Reason for Cancellation</label>
                  <textarea
                    rows={4}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g., Schedule conflict, Outside service area..."
                    className="w-full bg-cream border border-cream-darker focus:border-red-400 outline-none text-warm-dark font-medium p-8 rounded-2xl transition-all resize-none leading-relaxed"
                  />
               </div>

               <div className="flex gap-6 pt-4">
                 <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="flex-1 py-6 text-warm-gray text-[12px] font-semibold uppercase tracking-wider hover:text-warm-dark transition-all border border-cream-darker rounded-2xl"
                 >
                   Cancel
                 </button>
                 <button
                  type="submit"
                  className="flex-[2] py-6 bg-red-500 text-white text-[12px] font-semibold uppercase tracking-wider rounded-2xl hover:bg-red-600 transition-all shadow-sm active:scale-95"
                 >
                   Confirm Decline
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
