"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { onboardingApi, trainerApi, bookingApi } from "@/lib/api";
import { OnboardingData, Trainer, Booking } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name || "User";
  const user = session?.user as any;
  const isTrainer = user?.role === "trainer";

  useEffect(() => {
    if (isTrainer) router.replace("/trainer/dashboard");
  }, [isTrainer, router]);

  useEffect(() => {
    if (!user?.accessToken || isTrainer) return;

    const fetchData = async () => {
      try {
        const [trainersData, onboardingData, bookingsData] = await Promise.all([
            trainerApi.getRecommended(user.accessToken),
            onboardingApi.getMe(user.accessToken),
            bookingApi.getMyBookings(user.accessToken)
        ]);
        setTrainers(trainersData);
        setOnboarding(onboardingData);
        setBookings(bookingsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.accessToken]);

  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').slice(0, 2);

  const weight = onboarding?.weight || 0;
  const goal = onboarding?.goal || "Stay Fit";
  const workoutType = onboarding?.workoutType || "Gym";

  const isComplete = !!(onboarding && onboarding.age && onboarding.height && onboarding.weight);
  const showBanner = !isComplete;

  if (isTrainer) return null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <DashboardNavbar />

      <main className="page-container">
        {showBanner && (
           <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
               <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-warm-dark mb-0.5">Complete Your Fitness Profile</h3>
                 <p className="text-warm-gray text-sm">Add your metrics to unlock personalized recommendations.</p>
               </div>
             </div>
             <Link href="/dashboard/profile">
               <Button className="px-6 py-2.5 text-sm">Complete Now</Button>
             </Link>
           </div>
        )}

        <div className="space-y-1">
          <h1 className="section-header">
            Welcome back, <span className="text-primary">{userName}</span>
          </h1>
          <p className="text-warm-gray text-sm">
            Your Goal: <span className="text-warm-dark font-semibold">{goal}</span> via <span className="text-warm-dark font-semibold">{workoutType}</span> sessions.
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 text-center border-cream-darker">
            <p className="text-3xl font-bold text-primary">{bookings.length}</p>
            <p className="text-xs text-warm-gray mt-1">Total Bookings</p>
          </Card>
          <Card className="p-5 text-center border-cream-darker">
            <p className="text-3xl font-bold text-primary">{upcomingBookings.length}</p>
            <p className="text-xs text-warm-gray mt-1">Upcoming</p>
          </Card>
          <Card className="p-5 text-center border-cream-darker">
            <p className="text-3xl font-bold text-primary">{bookings.filter(b => b.status === 'completed').length}</p>
            <p className="text-xs text-warm-gray mt-1">Completed</p>
          </Card>
          <Card className="p-5 text-center border-cream-darker">
            <p className="text-3xl font-bold text-warm-dark">{weight > 0 ? `${weight}kg` : '--'}</p>
            <p className="text-xs text-warm-gray mt-1">Current Weight</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="card-premium col-span-1 md:col-span-2 relative overflow-hidden group border-none p-0">
            <div className="p-8 sm:p-10 space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="inline-flex px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/15">
                   Upcoming Schedule
                </span>
                <Link href="/dashboard/bookings" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                  Manage Bookings &rarr;
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map(b => (
                    <div key={b.id} className="flex justify-between items-center bg-cream p-5 rounded-xl border border-cream-darker hover:shadow-sm transition-all group/item">
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:scale-105 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-warm-dark text-lg tracking-tight leading-none mb-1">{b.trainerName}</h4>
                          <p className="text-xs text-primary font-medium">{b.date} at {b.timeSlot}</p>
                        </div>
                      </div>
                      <Link href="/dashboard/bookings">
                        <button className="btn-secondary py-2 px-5 text-xs">View</button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-warm-gray italic py-4">No sessions scheduled yet.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="card-premium space-y-5 flex flex-col border-primary/10 bg-primary/5 border-none">
            <h3 className="text-sm font-semibold text-warm-dark uppercase tracking-wider">Quick Actions</h3>
            <div className="flex flex-col gap-3 flex-1">
              <Link href="/trainers" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-darker hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-dark">Find a Trainer</p>
                  <p className="text-[11px] text-warm-gray">Browse our directory</p>
                </div>
              </Link>
              <Link href="/dashboard/bookings" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-darker hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-dark">My Schedule</p>
                  <p className="text-[11px] text-warm-gray">View all bookings</p>
                </div>
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-cream-darker hover:border-primary/20 hover:shadow-sm transition-all group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-dark">Edit Profile</p>
                  <p className="text-[11px] text-warm-gray">Update your metrics</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-warm-dark tracking-tight">Recommended For You</h2>
              <p className="text-warm-gray text-sm">Personalized matches based on your fitness goals.</p>
            </div>
            <Link href="/trainers">
              <Button variant="outline" className="py-2 px-4 text-xs">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
                [1,2,3,4].map(i => (
                    <div key={i} className="h-80 bg-cream-dark rounded-2xl animate-pulse border border-cream-darker" />
                ))
            ) : trainers.map((trainer) => (
                <Link key={trainer.id} href={`/trainers/${trainer.id}`} className="group h-full">
                  <Card className="card-premium p-4 space-y-4 hover:translate-y-[-4px] hover:shadow-lg transition-all flex flex-col h-full bg-white border-cream-darker">
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-cream-dark relative">
                      <img src={trainer.imageUrl || ""} alt={trainer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="text-center flex-1 px-2">
                      <h4 className="text-lg font-bold text-warm-dark group-hover:text-primary transition-colors tracking-tight leading-none mb-1">{trainer.name}</h4>
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">{trainer.specialty}</p>
                      {trainer.matchConfidence && (
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-16 h-1.5 bg-cream-darker rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${trainer.matchConfidence}%` }} />
                          </div>
                          <span className="text-[10px] text-primary font-semibold">{trainer.matchConfidence}% match</span>
                        </div>
                      )}
                      {trainer.matchReasons && trainer.matchReasons.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                          {trainer.matchReasons.slice(0, 2).map((reason, i) => (
                            <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/15">{reason}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-warm-gray line-clamp-2 leading-relaxed">{trainer.bio}</p>
                    </div>
                    <div className="mt-auto">
                      <button className="w-full btn-secondary py-2.5 text-xs group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">View Trainer</button>
                    </div>
                  </Card>
                </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
