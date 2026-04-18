"use client";

import TrainerNavbar from "@/components/TrainerNavbar";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { bookingApi, trainerApi } from "@/lib/api";
import { toast } from "sonner";
import { Booking, Trainer, TrainerAvailability } from "@/types";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function bucketSession(dateStr: string): 'today' | 'tomorrow' | 'thisWeek' | 'later' {
  const sessionDate = toDateOnly(new Date(dateStr));
  const today = toDateOnly(new Date());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  if (sessionDate.getTime() === today.getTime()) return 'today';
  if (sessionDate.getTime() === tomorrow.getTime()) return 'tomorrow';
  if (sessionDate < weekEnd) return 'thisWeek';
  return 'later';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TrainerDashboardPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<Partial<TrainerAvailability>[]>([]);

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

  const handleStatusUpdate = async (id: number, status: 'confirmed' | 'cancelled') => {
    if (status === 'cancelled') {
      setActiveBookingId(id);
      setShowCancelModal(true);
      return;
    }
    try {
      await bookingApi.updateStatus(id, status, undefined, user.accessToken);
      toast.success(`Session ${status === 'confirmed' ? 'accepted' : 'cancelled'}`);
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
      toast.success("Session declined");
      setShowCancelModal(false);
      setCancelReason('');
      fetchData();
    } catch (err) {
      toast.error("Failed to decline: " + (err as Error).message);
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
      toast.success("Calendar updated");
      setShowAvailabilityModal(false);
    } catch (err) {
      toast.error("Failed to update availability: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const isProfileIncomplete =
    !trainer?.bio?.trim() ||
    !trainer?.specialty?.trim() ||
    (trainer?.focus || []).length === 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const monthStart = new Date(); monthStart.setDate(1);

  const pendingRequests = sessions.filter(s => s.status === 'pending');
  const confirmedUpcoming = sessions
    .filter(s => s.status === 'confirmed' && s.date >= todayStr)
    .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
  const todaysSessions = confirmedUpcoming.filter(s => s.date === todayStr);
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const completedThisMonth = completedSessions.filter(s => new Date(s.date) >= monthStart);
  const monthlyEarnings = completedThisMonth.length * (trainer?.pricePerSession || 0);
  const lifetimeEarnings = completedSessions.length * (trainer?.pricePerSession || 0);
  const uniqueClients = new Set(sessions.map(s => s.userName)).size;

  const agendaGroups: Record<string, Booking[]> = { today: [], tomorrow: [], thisWeek: [], later: [] };
  confirmedUpcoming.forEach(s => { agendaGroups[bucketSession(s.date)].push(s); });

  if (loading) {
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
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-warm-dark mb-0.5">Visibility Restricted</h3>
                <p className="text-warm-gray text-sm">Add your bio, specialty and focus to appear in client searches.</p>
              </div>
            </div>
            <Link href="/trainer/profile" className="btn-primary text-sm">Complete Profile</Link>
          </div>
        )}

        <div>
          <h1 className="section-header">
            Welcome back, <span className="text-primary">{trainer?.name?.split(' ')[0] || 'Coach'}</span>
          </h1>
          <p className="text-warm-gray text-sm">
            {todaysSessions.length > 0
              ? `${todaysSessions.length} session${todaysSessions.length > 1 ? 's' : ''} on your calendar today.`
              : pendingRequests.length > 0
                ? `${pendingRequests.length} new request${pendingRequests.length > 1 ? 's' : ''} awaiting your response.`
                : 'No sessions today — manage your profile or set your availability.'}
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cream-darker">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">Today</p>
            <h3 className="text-2xl font-bold text-warm-dark">{todaysSessions.length}</h3>
            <p className="text-[11px] text-warm-gray mt-1">confirmed</p>
          </div>
          <div className={`p-5 rounded-2xl border ${pendingRequests.length > 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-white border-cream-darker'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-primary'}`}>Pending</p>
            <h3 className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-amber-600' : 'text-warm-dark'}`}>{pendingRequests.length}</h3>
            <p className="text-[11px] text-warm-gray mt-1">to review</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-cream-darker">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">Clients</p>
            <h3 className="text-2xl font-bold text-warm-dark">{uniqueClients}</h3>
            <p className="text-[11px] text-warm-gray mt-1">unique</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-cream-darker">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">This Month</p>
            <h3 className="text-2xl font-bold text-primary">£{monthlyEarnings}</h3>
            <p className="text-[11px] text-warm-gray mt-1">{completedThisMonth.length} done</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-cream-darker">
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">Rating</p>
            <h3 className="text-2xl font-bold text-warm-dark flex items-baseline gap-1">
              {(trainer?.rating || 0).toFixed(1)}
              <span className="text-amber-400 text-base">★</span>
            </h3>
            <p className="text-[11px] text-warm-gray mt-1">£{trainer?.pricePerSession || 0}/hr</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <section className="card-premium border-amber-500/30">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-warm-dark flex items-center gap-3">
                      Pending <span className="text-amber-600">Requests</span>
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    </h2>
                    <p className="text-xs text-warm-gray mt-1">Clients waiting on your response.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((s) => (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-amber-50/60 rounded-xl border border-amber-200/40">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 font-bold uppercase">
                          {s.userName?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-warm-dark text-sm">{s.userName}</h4>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-warm-gray mt-0.5">
                            <span>{formatDate(s.date)}</span>
                            <span>·</span>
                            <span>{s.timeSlot}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-0">
                        <button onClick={() => handleStatusUpdate(s.id, 'confirmed')} className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-all uppercase tracking-wider active:scale-95">Accept</button>
                        <button onClick={() => handleStatusUpdate(s.id, 'cancelled')} className="px-4 py-2 bg-white border border-cream-darker text-red-500 text-xs font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider active:scale-95">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Agenda */}
            <section className="card-premium">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-cream-darker">
                <div>
                  <h2 className="text-xl font-bold text-warm-dark">Agenda <span className="text-primary">Overview</span></h2>
                  <p className="text-xs text-warm-gray mt-1">{confirmedUpcoming.length} confirmed session{confirmedUpcoming.length === 1 ? '' : 's'} ahead.</p>
                </div>
              </div>

              {confirmedUpcoming.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-cream-darker rounded-xl">
                  <p className="text-warm-gray text-sm font-medium">No confirmed sessions on the horizon.</p>
                  <p className="text-warm-gray text-xs mt-1">Accept pending requests to fill your calendar.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(['today', 'tomorrow', 'thisWeek', 'later'] as const).map(bucket => {
                    const items = agendaGroups[bucket];
                    if (items.length === 0) return null;
                    const labels = { today: 'Today', tomorrow: 'Tomorrow', thisWeek: 'This Week', later: 'Later' };
                    return (
                      <div key={bucket}>
                        <div className="flex items-center gap-3 mb-3">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{labels[bucket]}</p>
                          <span className="text-[10px] text-warm-gray font-semibold">{items.length}</span>
                          <div className="flex-1 h-px bg-cream-darker" />
                        </div>
                        <div className="space-y-2">
                          {items.map(s => (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-cream rounded-xl border border-cream-darker hover:border-primary/30 transition-all group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                  {s.userName?.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-warm-dark text-sm">{s.userName}</h4>
                                  <p className="text-[11px] text-warm-gray font-medium">
                                    {bucket === 'today' || bucket === 'tomorrow' ? labels[bucket] : formatDate(s.date)} · {s.timeSlot}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                <span className="px-2.5 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-semibold rounded-full uppercase tracking-wider border border-green-500/20">Confirmed</span>
                                <button onClick={() => handleStatusUpdate(s.id, 'cancelled')} className="text-[10px] font-semibold text-red-400 hover:text-red-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Cancel</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>


          <div className="space-y-6">
            <section className="card-premium">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl bg-cream-dark overflow-hidden border border-cream-darker shrink-0">
                  {trainer?.imageUrl ? (
                    <img src={trainer.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center">
                      {trainer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-warm-dark truncate">{trainer?.name}</h3>
                  <p className="text-[11px] text-primary font-semibold uppercase tracking-wider truncate">{trainer?.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-cream rounded-lg p-3 text-center">
                  <p className="text-base font-bold text-warm-dark flex items-baseline justify-center gap-0.5">
                    {(trainer?.rating || 0).toFixed(1)}<span className="text-amber-400 text-xs">★</span>
                  </p>
                  <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Rating</p>
                </div>
                <div className="bg-cream rounded-lg p-3 text-center">
                  <p className="text-base font-bold text-warm-dark">{trainer?.totalSessions || 0}</p>
                  <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Sessions</p>
                </div>
                <div className="bg-cream rounded-lg p-3 text-center">
                  <p className="text-base font-bold text-primary">£{lifetimeEarnings}</p>
                  <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Earned</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-cream-darker text-left">
                <div>
                  <p className="text-[10px] font-semibold text-warm-gray uppercase tracking-wider mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer?.focus && trainer.focus.length > 0 ? trainer.focus.map(f => (
                      <span key={f} className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-md">{f}</span>
                    )) : <span className="text-warm-gray text-xs">Not set</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warm-gray">Intensity</span>
                  <span className="text-warm-dark font-medium">Level {trainer?.intensity || 3}/5</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warm-gray">Location</span>
                  <span className="text-warm-dark font-medium">{trainer?.location || 'Gym'}</span>
                </div>
              </div>

              <Link href="/trainer/profile" className="block w-full mt-5 py-2.5 bg-cream-dark text-warm-dark text-xs font-semibold rounded-lg hover:bg-cream-darker transition-all uppercase tracking-wider text-center">Manage Profile</Link>
            </section>

            <section className="card-premium">
              <h3 className="text-base font-bold text-warm-dark mb-4 flex items-center justify-between">
                Schedule
                <button onClick={() => setShowAvailabilityModal(true)} className="text-primary text-[10px] font-semibold uppercase tracking-wider hover:underline">Edit</button>
              </h3>
              <div className="space-y-2">
                {DAYS.map((day, idx) => {
                  const av = trainer?.availability?.find(a => a.dayOfWeek === idx);
                  return (
                    <div key={day} className="flex justify-between items-center text-xs">
                      <span className="text-warm-gray font-medium">{day}</span>
                      {av && !av.isClosed ? (
                        <span className="text-warm-dark font-semibold px-2.5 py-0.5 bg-cream rounded-md text-[11px]">{av.startTime} – {av.endTime}</span>
                      ) : (
                        <span className="text-red-300 uppercase tracking-wider text-[10px]">Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-md max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-cream-darker">
            <div className="p-6 border-b border-cream-darker flex justify-between items-center bg-cream">
              <div>
                <h2 className="text-xl font-bold text-warm-dark">Weekly Availability</h2>
                <p className="text-xs text-warm-gray mt-0.5">Set the hours you're open for sessions.</p>
              </div>
              <button onClick={() => setShowAvailabilityModal(false)} className="p-2 hover:bg-cream-dark rounded-lg transition-all">
                <svg className="w-5 h-5 text-warm-gray hover:text-warm-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {DAYS.map((day, index) => {
                const avail = localAvailability.find(a => a.dayOfWeek === index);
                const isClosed = avail?.isClosed;

                return (
                  <div key={day} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isClosed ? 'bg-cream border-transparent opacity-50' : 'bg-white border-cream-darker hover:border-primary/30'}`}>
                    <div className="flex items-center gap-4">
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!isClosed} onChange={() => handleToggleDay(index)} className="sr-only peer" />
                        <div className="w-10 h-6 bg-cream-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      <span className={`text-sm font-semibold w-12 ${isClosed ? 'text-warm-gray' : 'text-warm-dark'}`}>{day}</span>
                    </div>

                    {!isClosed ? (
                      <div className="flex items-center gap-3">
                        <input type="time" value={avail?.startTime} onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)} className="bg-cream border border-cream-darker text-warm-dark text-xs font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/20" />
                        <span className="text-[10px] font-medium text-warm-gray">to</span>
                        <input type="time" value={avail?.endTime} onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)} className="bg-cream border border-cream-darker text-warm-dark text-xs font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 ring-primary/20" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-warm-gray uppercase tracking-wider">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-cream-darker bg-cream flex gap-3">
              <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 py-3 text-warm-gray text-xs font-semibold uppercase tracking-wider hover:text-warm-dark transition-all">Cancel</button>
              <button onClick={handleSaveAvailability} disabled={isSaving} className="flex-[2] py-3 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-md max-w-md w-full animate-in zoom-in-95 duration-300 border border-cream-darker">
            <div className="p-6 border-b border-cream-darker flex justify-between items-center bg-cream">
              <h2 className="text-lg font-bold text-warm-dark">Decline Request</h2>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); }} className="p-2 hover:bg-cream-dark rounded-lg">
                <svg className="w-5 h-5 text-warm-gray hover:text-warm-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-5">
              <p className="text-sm text-warm-gray leading-relaxed">
                Let the client know why you can't take this session.
              </p>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-red-400 uppercase tracking-wider ml-1">Reason</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, Outside service area..."
                  className="input-premium w-full resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCancelModal(false); setCancelReason(''); }} className="flex-1 py-3 text-warm-gray text-xs font-semibold uppercase tracking-wider hover:text-warm-dark transition-all border border-cream-darker rounded-lg">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-red-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-red-600 transition-all active:scale-95">Confirm Decline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
