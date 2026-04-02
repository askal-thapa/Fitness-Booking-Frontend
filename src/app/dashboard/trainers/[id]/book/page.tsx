"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trainerApi, bookingApi } from "@/lib/api";
import { Trainer } from "@/types";
import { toast } from "sonner";

const availableDates = [
  { day: "Thu", date: "2026-04-09", display: "09", full: "Thursday, April 9" },
  { day: "Fri", date: "2026-04-10", display: "10", full: "Friday, April 10" },
  { day: "Sat", date: "2026-04-11", display: "11", full: "Saturday, April 11" },
  { day: "Mon", date: "2026-04-13", display: "13", full: "Monday, April 13" },
  { day: "Tue", date: "2026-04-14", display: "14", full: "Tuesday, April 14" }
];

const availableTimes = ["08:00", "09:30", "11:00", "14:00", "15:30", "17:00"];

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const data = await trainerApi.getOne(id as string, user?.accessToken);
        setTrainer(data);
      } catch (err) {
        toast.error("Failed to fetch trainer details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTrainer();
  }, [id, user?.accessToken]);

  const handleBooking = async () => {
    if (!selectedTime || !user?.accessToken || !trainer) return;

    try {
      setBookingLoading(true);
      const response = await bookingApi.create({
        trainerId: trainer.id,
        date: selectedDate.date,
        timeSlot: selectedTime,
      }, user.accessToken);

      if (response.checkoutUrl) {
        toast.success("Redirecting to secure payment...");
        window.location.href = response.checkoutUrl;
      } else {
        toast.success("Booking confirmed!");
        router.push("/dashboard/bookings");
      }
    } catch (err) {
      toast.error("Booking failed: " + (err as Error).message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center text-warm-dark">Loading...</div>;
  if (!trainer) return <div className="min-h-screen bg-cream flex items-center justify-center text-warm-dark">Trainer not found</div>;

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNavbar />

      <main className="page-container">
        <Link href={`/trainers/${trainer.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-all mb-10 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Profile
        </Link>

        <div className="mb-10">
          <h1 className="section-header">Schedule <span className="text-primary">Session</span></h1>
          <p className="text-warm-gray text-lg">Select a convenient time for your training session.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Trainer Snapshot */}
            <div className="card-premium flex flex-col md:flex-row items-center gap-6 bg-primary/5 border-primary/10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-cream-darker shrink-0 shadow-sm">
                <img src={trainer.imageUrl} alt={trainer.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-warm-dark mb-1">{trainer.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-primary">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {trainer.specialty}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {trainer.location || "Online"}
                  </span>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-xs text-warm-gray mb-1">Session Rate</p>
                <p className="text-2xl font-bold text-warm-dark">&pound;{trainer.pricePerSession}</p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <h3 className="text-lg font-bold text-warm-dark flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                    1. Select Date
                  </h3>
                  <span className="text-xs font-medium text-primary">{selectedDate.full}</span>
               </div>

               <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {availableDates.map((dateObj, idx) => {
                    const isSelected = selectedDate.date === dateObj.date;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(dateObj)}
                        className={`flex flex-col items-center justify-center min-w-[80px] py-5 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-warm-dark shadow-sm'
                            : 'border-cream-darker bg-white text-warm-gray hover:border-primary/30'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold uppercase mb-1 ${isSelected ? 'text-primary' : 'text-warm-gray'}`}>
                          {dateObj.day}
                        </span>
                        <span className="text-2xl font-bold tracking-tight">{dateObj.display}</span>
                      </button>
                    );
                  })}
               </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-6">
               <h3 className="text-lg font-bold text-warm-dark flex items-center gap-2">
                 <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                 2. Select Time Slot
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTimes.map((time, idx) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTime(time)}
                        className={`py-4 px-5 text-center border rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-warm-dark shadow-sm'
                            : 'border-cream-darker bg-white text-warm-gray hover:border-primary/30'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
               </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-32">
               <h3 className="text-lg font-bold text-warm-dark mb-6 pb-4 border-b border-cream-darker">Booking Summary</h3>

               <div className="space-y-5 mb-8">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-gray font-medium">Trainer</span>
                    <span className="text-base font-semibold text-warm-dark">{trainer.name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-gray font-medium">Date</span>
                    <span className="text-base font-semibold text-warm-dark">{selectedDate.full}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-warm-gray font-medium">Time</span>
                    <span className="text-base font-semibold text-primary">
                      {selectedTime ? selectedTime : <span className="text-warm-gray italic">Select a time...</span>}
                    </span>
                  </div>
                  <div className="p-3 bg-cream rounded-xl border border-cream-darker">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-warm-gray">Duration</span>
                       <span className="text-warm-dark font-semibold">60 mins</span>
                    </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-cream-darker space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Total</span>
                    <span className="text-2xl font-bold text-warm-dark">&pound;{trainer.pricePerSession}</span>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!selectedTime || bookingLoading}
                    className="btn-primary w-full"
                  >
                    {bookingLoading ? "Processing..." : "Confirm Booking"}
                  </button>
                  <p className="text-center text-xs text-warm-gray leading-relaxed">
                    By confirming, you agree to the trainer's cancellation policy.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
