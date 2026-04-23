"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { bookingApi, trainerApi } from "@/lib/api";
import { toast } from "sonner";
import { Booking } from "@/types";
import { Avatar } from '@/components/ui/Avatar';

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const user = session?.user as any;
  const isTrainer = user?.role === "trainer";

  useEffect(() => {
    if (isTrainer) router.replace("/trainer/dashboard");
  }, [isTrainer, router]);

  // Show success banner when redirected from Stripe
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccessBanner(true);
      toast.success("Payment successful! Your session is confirmed.");
      // Clean the URL params
      window.history.replaceState({}, '', '/dashboard/bookings');
    }
    if (searchParams?.get('cancelled') === 'true') {
      toast.error("Payment was cancelled. Your booking is still pending.");
      window.history.replaceState({}, '', '/dashboard/bookings');
    }
  }, [searchParams]);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const fetchBookings = async () => {
    if (!user?.accessToken) return;
    try {
      setLoading(true);
      const data = await bookingApi.getMyBookings(user.accessToken);
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.accessToken]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId || !user?.accessToken) return;

    try {
      await trainerApi.submitReview({
        bookingId: activeBookingId,
        rating: reviewRating,
        comment: reviewComment,
      }, user.accessToken);

      toast.success("Thank you for your review!");
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      fetchBookings();
    } catch (err) {
      toast.error("Failed to submit review: " + (err as Error).message);
    }
  };

  const handleCancelAction = (id: number) => {
    setActiveBookingId(id);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId || !user?.accessToken) return;

    try {
      await bookingApi.updateStatus(activeBookingId, 'cancelled', cancelReason, user.accessToken);
      toast.success("Booking cancelled successfully");
      setShowCancelModal(false);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      toast.error("Failed to cancel booking: " + (err as Error).message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'Upcoming') return booking.status === 'pending' || booking.status === 'confirmed';
    if (activeTab === 'Past') return booking.status === 'completed';
    return booking.status === 'cancelled';
  });

  const handlePayNow = async (bookingId: number) => {
    if (!user?.accessToken) return;
    try {
      const result = await bookingApi.retryPayment(bookingId, user.accessToken);
      if (result.checkoutUrl) {
        toast.success("Redirecting to payment...");
        window.location.href = result.checkoutUrl;
      }
    } catch (err) {
      toast.error("Failed to initiate payment: " + (err as Error).message);
    }
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'pending' && booking.paymentStatus === 'unpaid') {
      return <span className="badge-premium bg-yellow-50 text-yellow-600 border-yellow-200">Awaiting Payment</span>;
    }

    switch (booking.status) {
      case 'pending':
      case 'confirmed':
        return <span className="badge-premium bg-primary/10 text-primary border-primary/20">{booking.paymentStatus === 'paid' ? 'Confirmed' : 'Upcoming'}</span>;
      case 'completed':
        return <span className="badge-premium bg-cream-dark text-warm-gray border-cream-darker">Completed</span>;
      case 'cancelled':
        return <span className="badge-premium bg-red-50 text-red-500 border-red-200">Cancelled</span>;
      default:
        return null;
    }
  };

  if (isTrainer) return null;

  return (
    <div className="min-h-screen bg-cream">
      <DashboardNavbar />

      <main className="page-container">
        {showSuccessBanner && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Booking Confirmed!</h3>
                <p className="text-green-600 text-sm">Your payment was successful and your session is confirmed.</p>
              </div>
            </div>
            <button onClick={() => setShowSuccessBanner(false)} className="text-green-400 hover:text-green-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="section-header !mb-2">My <span className="text-primary">Schedule</span></h1>
            <p className="text-warm-gray text-base">Manage your upcoming workouts and track your fitness history.</p>
          </div>
          <Link href="/trainers" className="btn-primary w-full md:w-auto text-center">
            Book New Session
          </Link>
        </div>

        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex border-b border-cream-darker pt-2 overflow-x-auto hide-scrollbar gap-6">
            {['Upcoming', 'Past', 'Cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-primary'
                    : 'text-warm-gray/50 hover:text-warm-gray'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
               <div className="p-16 text-center text-warm-gray italic animate-pulse">Loading your schedule...</div>
            ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="card-premium group flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <Avatar src={booking.trainerImageUrl} name={booking.trainerName || 'Trainer'} size="lg" />
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-warm-dark tracking-tight leading-none">{booking.trainerName}</h3>
                          {getStatusBadge(booking)}
                        </div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">{booking.trainerSpecialty}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-warm-gray pt-1">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(booking.date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {booking.timeSlot}
                          </div>
                        </div>
                        {booking.cancellationReason && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-3">
                            <p className="text-xs text-red-400 font-semibold mb-0.5">Reason for Cancellation</p>
                            <p className="text-sm text-red-500 italic">&ldquo;{booking.cancellationReason}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-3 justify-start sm:justify-end lg:w-44 pt-4 lg:pt-0 border-t lg:border-t-0 border-cream-darker">
                      {booking.status === 'pending' && booking.paymentStatus === 'unpaid' ? (
                        <div className="space-y-2 w-full">
                          <button
                            onClick={() => handlePayNow(booking.id)}
                            className="btn-primary w-full text-xs"
                          >
                            Pay Now
                          </button>
                          <button
                            onClick={() => handleCancelAction(booking.id)}
                            className="btn-secondary w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (booking.status === 'pending' || booking.status === 'confirmed') ? (
                        <button
                          onClick={() => handleCancelAction(booking.id)}
                          className="btn-secondary w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      ) : (
                        <div className="space-y-2 w-full">
                           {booking.status === 'completed' && !booking.isReviewed && (
                             <button
                                onClick={() => {
                                  setActiveBookingId(booking.id);
                                  setShowReviewModal(true);
                                }}
                                className="btn-primary w-full text-xs"
                             >
                                Rate Session
                             </button>
                           )}
                           <Link href={`/trainers/${booking.trainerId}`} className="btn-secondary w-full text-xs block text-center">
                             Book Again
                           </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="card-premium p-16 text-center border-dashed border-2 border-cream-darker">
                <div className="w-16 h-16 bg-cream-dark rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cream-darker">
                  <svg className="w-8 h-8 text-warm-gray/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-warm-dark mb-2">No {activeTab.toLowerCase()} sessions</h3>
                <p className="text-warm-gray mb-6">Your schedule is currently clear for this category.</p>
                {activeTab === 'Upcoming' && (
                  <Link href="/trainers" className="btn-primary inline-block">
                    Find a Trainer
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full animate-in zoom-in-95 duration-300 border border-cream-darker">
            <div className="p-6 border-b border-cream-darker flex justify-between items-center">
              <h2 className="text-2xl font-bold text-warm-dark">Rate <span className="text-primary">Session</span></h2>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-cream-dark rounded-xl transition-all text-warm-gray hover:text-warm-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-8 space-y-8">
               <div className="space-y-4 text-center">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Session Quality</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`p-1.5 transition-all hover:scale-110 active:scale-95 ${reviewRating >= star ? 'text-yellow-500' : 'text-cream-darker'}`}
                      >
                        <svg className="w-10 h-10 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Feedback</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="input-premium w-full resize-none"
                  />
               </div>

               <button
                type="submit"
                className="btn-primary w-full"
               >
                 Submit Review
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-warm-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-300 border border-cream-darker">
            <div className="p-6 border-b border-cream-darker flex justify-between items-center">
              <h2 className="text-2xl font-bold text-warm-dark">Cancel <span className="text-red-500">Session</span></h2>
              <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-cream-dark rounded-xl transition-all text-warm-gray hover:text-warm-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-8 space-y-6">
               <div className="space-y-2">
                  <p className="text-warm-gray text-sm leading-relaxed">
                    We're sorry to see you cancel. Please let us know why so we can improve.
                  </p>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-red-500 uppercase tracking-wider ml-1">Reason for Cancellation</label>
                  <textarea
                    rows={4}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g., Schedule conflict, Personal reasons..."
                    className="input-premium w-full resize-none focus:border-red-400 focus:ring-red-100"
                  />
               </div>

               <div className="flex gap-4">
                 <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary flex-1"
                 >
                   Back
                 </button>
                 <button
                  type="submit"
                  className="btn-primary flex-[2] bg-red-500 hover:bg-red-600"
                 >
                   Confirm Cancellation
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
