"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import React, { useEffect, useState, useRef } from 'react';
import { onboardingApi } from '@/lib/api';
import { Menu, X, LogOut, LayoutDashboard, User, Calendar, ChevronDown, MessageCircle } from 'lucide-react';
import { Avatar } from './ui/Avatar';

export default function Navbar() {
  const { data: session } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const fullName = user?.name || "Member";
  const isTrainer = user?.role === "trainer";
  const dashboardLink = isTrainer ? "/trainer/dashboard" : "/dashboard";

  useEffect(() => {
    if (user?.accessToken) {
      onboardingApi.getMe(user.accessToken)
        .then(data => {
          if (data.imageUrl) setProfileImage(data.imageUrl);
        })
        .catch(() => {});
    }
  }, [user?.accessToken]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-cream/90 backdrop-blur-md border-b border-cream-darker">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-warm-dark flex items-center gap-2 group">
          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">A</span>
          ASKAL
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/trainers" className="text-sm font-medium text-warm-gray hover:text-warm-dark transition-colors">
            Browse Trainers
          </Link>

          {session && (
            <Link href="/chat" className="text-sm font-medium text-warm-gray hover:text-warm-dark transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Messages
            </Link>
          )}

          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 bg-white pl-3 pr-2 py-1.5 rounded-xl border border-cream-darker hover:shadow-sm transition-all"
              >
                <div className="text-right">
                  <p className="text-xs font-semibold text-warm-dark leading-tight">{fullName.split(' ')[0]}</p>
                  <p className="text-[10px] text-primary leading-tight">{isTrainer ? 'Trainer' : 'Member'}</p>
                </div>
                <Avatar src={profileImage} name={fullName} size="xs" />
                <ChevronDown className={`w-3.5 h-3.5 text-warm-gray transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-cream-darker shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 border-b border-cream-darker mb-1">
                    <p className="text-sm font-semibold text-warm-dark">{fullName}</p>
                    <p className="text-xs text-warm-gray">{user?.email}</p>
                  </div>
                  <Link href={dashboardLink} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/chat" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                    <MessageCircle className="w-4 h-4" /> Messages
                  </Link>
                  {!isTrainer && (
                    <>
                      <Link href="/dashboard/bookings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                        <Calendar className="w-4 h-4" /> My Bookings
                      </Link>
                      <Link href="/dashboard/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                    </>
                  )}
                  <div className="border-t border-cream-darker mt-1 pt-1">
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-warm-gray hover:text-warm-dark transition-colors">Log in</Link>
              <Link href="/login" className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-xl hover:bg-primary-hover transition-all shadow-sm">Join Now</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-warm-dark p-2 hover:bg-cream-dark rounded-lg transition-colors">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-cream-darker animate-in slide-in-from-top duration-200">
          <div className="flex flex-col p-5 gap-1">
            <Link href="/trainers" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
              Browse Trainers
            </Link>
            {session ? (
              <>
                <div className="h-px bg-cream-darker my-2" />
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <Avatar src={profileImage} name={fullName} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-warm-dark">{fullName}</p>
                    <p className="text-xs text-primary">{isTrainer ? 'Trainer' : 'Member'}</p>
                  </div>
                </div>
                <Link href={dashboardLink} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link href="/chat" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                  <MessageCircle className="w-4 h-4" /> Messages
                </Link>
                {!isTrainer && (
                  <>
                    <Link href="/dashboard/bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                      <Calendar className="w-4 h-4" /> My Bookings
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-warm-gray hover:bg-cream hover:text-warm-dark transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </>
                )}
                <div className="h-px bg-cream-darker my-2" />
                <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-cream-darker my-2" />
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-center p-3 text-warm-gray hover:text-warm-dark font-medium">Log in</Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-center p-3 bg-primary text-white font-semibold rounded-xl">Join Now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
