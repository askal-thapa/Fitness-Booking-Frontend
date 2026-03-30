"use client";

import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trainerApi, bookingApi } from "@/lib/api";
import { Trainer, Booking } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSession } from 'next-auth/react';
import { toast } from "sonner";

export default function PublicTrainerDetailsPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const trainerId = parseInt(id as string);
        if (isNaN(trainerId)) {
            setLoading(false);
            return;
        }
        const [trainerData, bookingsData] = await Promise.all([
            trainerApi.getOne(id as string),
            bookingApi.getByTrainer(trainerId)
        ]);
        setTrainer(trainerData);
        setExistingBookings(bookingsData);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const generateSlots = () => {
    if (!trainer?.availability) return [];
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();
    const dayConfig = trainer.availability.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayConfig || dayConfig.isClosed) return [];

    const slots = [];
    let current = parseInt(dayConfig.startTime.split(':')[0]);
    const end = parseInt(dayConfig.endTime.split(':')[0]);

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const bufferHour = now.getHours() + 5;

    while (current < end) {
      if (isToday && current < bufferHour) {
        current++;
        continue;
      }

      const time = `${current.toString().padStart(2, '0')}:00`;
      slots.push(time);
      current++;
    }
    return slots;
  };

  const handleBooking = async () => {
    if (!session?.user) {
        router.push(`/login?callbackUrl=/trainers/${id}`);
        return;
    }
    if (!selectedSlot || !trainer) return;

    setIsBooking(true);
    try {
        const user = session.user as any;
        const result = await bookingApi.create({
            trainerId: trainer.id,
            date: selectedDate,
            timeSlot: selectedSlot,
        }, user.accessToken);

        // If Stripe checkout URL is returned, redirect to payment
        if (result.checkoutUrl) {
            toast.success("Redirecting to secure payment...");
            window.location.href = result.checkoutUrl;
            return;
        }

        // Fallback: if no Stripe (e.g. Stripe not configured), confirm directly
        const updatedBookings = await bookingApi.getByTrainer(trainer?.id!);
        setExistingBookings(updatedBookings);
        setSelectedSlot(null);
        toast.success("Booking created! Check your bookings for payment status.");
        router.push('/dashboard/bookings');
    } catch (err: any) {
        toast.error(err.message || "Failed to create booking");
    } finally {
        setIsBooking(false);
    }
  };

  const isSlotBooked = (slot: string) => {
    return existingBookings.some(b => b.date.startsWith(selectedDate) && b.timeSlot === slot);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-warm-dark">
        <h1 className="text-2xl font-bold mb-4">Trainer Not Found</h1>
        <Button onClick={() => router.push('/trainers')}>Back to Directory</Button>
      </div>
    );
  }

  const slots = generateSlots();
  const next7Days = getNext7Days();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-32 flex-1 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-warm-gray hover:text-warm-dark transition-colors mb-10 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="text-sm font-medium">Back to Directory</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <section className="relative rounded-2xl overflow-hidden bg-white border border-cream-darker shadow-sm">
              <div className="h-56 bg-cream-dark relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 z-10" />
                 <img src={trainer.imageUrl || ""} className="w-full h-full object-cover opacity-40 blur-sm scale-110" alt="" />
              </div>

              <div className="px-8 pb-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 relative z-20">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-cream-dark shadow-lg shrink-0">
                     <img src={trainer.imageUrl || ""} alt={trainer.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-warm-dark tracking-tight">{trainer.name}</h1>
                        <p className="text-primary font-semibold uppercase tracking-wider text-xs">{trainer.specialty}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-cream-dark px-3.5 py-2 rounded-xl text-sm font-semibold text-warm-dark border border-cream-darker">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {trainer.rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-8 mt-8 border-t border-cream-darker text-center sm:text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-warm-dark">{trainer.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Focus</p>
                    <p className="text-sm font-medium text-warm-dark">{Array.isArray(trainer.focus) ? trainer.focus.join(', ') : trainer.focus || 'General Fitness'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Intensity</p>
                    <p className="text-sm font-medium text-warm-dark">Level {trainer.intensity}/5</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-semibold text-primary uppercase tracking-wider">Rate</p>
                     <p className="text-sm font-medium text-warm-dark">&pound;{trainer.pricePerSession?.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-semibold text-primary uppercase tracking-wider">Sessions</p>
                     <p className="text-sm font-medium text-warm-dark">{trainer.totalSessions || 0} completed</p>
                  </div>
                </div>
              </div>
            </section>

            <Card className="p-8 space-y-4 border-cream-darker">
              <h2 className="text-xl font-bold text-warm-dark tracking-tight">Biography</h2>
              <p className="text-warm-gray leading-relaxed text-base italic">
                &ldquo;{trainer.bio}&rdquo;
              </p>
            </Card>

            {/* Specialties & Focus Tags */}
            {((trainer.focus && trainer.focus.length > 0) || (trainer.specialties && trainer.specialties.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {trainer.focus && trainer.focus.length > 0 && (
                  <Card className="p-6 border-cream-darker space-y-3">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Training Focus</h3>
                    <div className="flex flex-wrap gap-2">
                      {trainer.focus.map(f => (
                        <span key={f} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/15">{f}</span>
                      ))}
                    </div>
                  </Card>
                )}
                {trainer.specialties && trainer.specialties.length > 0 && (
                  <Card className="p-6 border-cream-darker space-y-3">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {trainer.specialties.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-cream-dark text-warm-dark text-xs font-semibold rounded-lg border border-cream-darker">{s}</span>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <section className="space-y-6">
               <h2 className="text-xl font-bold text-warm-dark tracking-tight flex items-center gap-2">
                  Client Reviews
                  <span className="text-sm font-medium text-warm-gray">({trainer.reviews?.length || 0})</span>
               </h2>

               <div className="grid gap-4">
                  {trainer.reviews && trainer.reviews.length > 0 ? (
                    trainer.reviews.map(review => (
                      <Card key={review.id} className="p-6 border-cream-darker space-y-3">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                  {review.userName.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-semibold text-warm-dark">{review.userName}</p>
                                  <p className="text-xs text-warm-gray">{new Date(review.createdAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="flex gap-0.5">
                               {[1,2,3,4,5].map(star => (
                                 <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-500' : 'text-cream-darker'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                 </svg>
                               ))}
                            </div>
                         </div>
                         <p className="text-warm-gray leading-relaxed italic">&ldquo;{review.comment}&rdquo;</p>
                      </Card>
                    ))
                  ) : (
                    <p className="text-warm-gray italic">No reviews yet for this professional.</p>
                  )}
               </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-8 sticky top-32 space-y-6 border-primary/15 bg-primary/5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-warm-dark tracking-tight">Schedule</h2>
                <p className="text-warm-gray text-xs font-medium text-center">Next 7 Days Availability</p>
              </div>

              <div className="space-y-6">
                {/* Custom Date Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {next7Days.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateStr;
                        return (
                            <button
                                key={dateStr}
                                onClick={() => {
                                    setSelectedDate(dateStr);
                                    setSelectedSlot(null);
                                }}
                                className={`flex-shrink-0 w-14 py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                                    isSelected
                                        ? 'bg-primary border-primary text-white shadow-sm'
                                        : 'bg-white border-cream-darker text-warm-gray hover:border-primary/30'
                                }`}
                            >
                                <span className="text-[10px] font-semibold uppercase">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-lg font-bold leading-none">
                                    {date.getDate()}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {slots.length > 0 ? (
                        slots.map(slot => {
                            const isBooked = isSlotBooked(slot);
                            return (
                                <button
                                    key={slot}
                                    disabled={isBooked}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all relative overflow-hidden ${
                                        isBooked
                                            ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                                            : selectedSlot === slot
                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                : 'bg-white border-cream-darker text-warm-dark hover:border-primary/30'
                                    }`}
                                >
                                    {slot}
                                    {isBooked && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-semibold">Full</div>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <div className="col-span-2 py-8 text-center text-warm-gray italic text-sm">
                            No availability for this day.
                        </div>
                    )}
                </div>
              </div>

              <div className="py-4 border-y border-cream-darker space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-warm-gray font-medium">Rate per Session</span>
                    <span className="text-warm-dark font-bold text-lg leading-none">&pound;{trainer.pricePerSession?.toFixed(2)}</span>
                </div>
              </div>

              <Button
                fullWidth
                disabled={!selectedSlot || isBooking}
                onClick={handleBooking}
              >
                {isBooking ? 'Processing...' : `Book & Pay \u00A3${trainer.pricePerSession?.toFixed(2)}`}
              </Button>

              {!session?.user && (
                <p className="text-xs text-center text-warm-gray">
                    Authentication required to book
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
