"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { onboardingApi } from '@/lib/api';
import { Menu, X, LogOut, LayoutDashboard, Users, Calendar, User, HelpCircle, MessageCircle } from 'lucide-react';
import { ProfileMenu } from './ui/ProfileMenu';

export default function DashboardNavbar() {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = session?.user as any;
  const fullName = user?.name || "User";
  const email = user?.email || "";
  const roleDisplay = user?.role === "trainer" ? "Pro Trainer" : "Member";

  useEffect(() => {
    if (user?.accessToken) {
      onboardingApi.getMe(user.accessToken)
        .then(data => {
          if (data.imageUrl) setProfileImage(data.imageUrl);
        })
        .catch(err => console.error("Nav profile fetch error:", err));
    }
  }, [user?.accessToken]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Profile', href: '/dashboard/profile', icon: <User className="w-4 h-4" /> },
    { label: 'My Bookings', href: '/dashboard/bookings', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Browse Trainers', href: '/trainers', icon: <Users className="w-4 h-4" /> },
    { label: 'Help & Support', href: '/contact', icon: <HelpCircle className="w-4 h-4" />, divider: true },
    { label: 'Logout', onClick: () => signOut({ callbackUrl: '/' }), icon: <LogOut className="w-4 h-4" />, variant: 'danger' as const, divider: true },
  ];

  return (
    <nav className="w-full bg-white border-b border-cream-darker sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-xl font-bold tracking-tight text-warm-dark flex items-center gap-2 group">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">A</span>
            ASKAL
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                pathname === '/dashboard'
                  ? 'text-primary bg-primary/5'
                  : 'text-warm-gray hover:text-warm-dark hover:bg-cream-dark'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/trainers"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                pathname.startsWith('/trainers')
                  ? 'text-primary bg-primary/5'
                  : 'text-warm-gray hover:text-warm-dark hover:bg-cream-dark'
              }`}
            >
              Trainers
            </Link>
            <Link
              href="/dashboard/bookings"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                pathname.startsWith('/dashboard/bookings')
                  ? 'text-primary bg-primary/5'
                  : 'text-warm-gray hover:text-warm-dark hover:bg-cream-dark'
              }`}
            >
              Bookings
            </Link>
            <Link
              href="/chat"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg flex items-center gap-1.5 ${
                pathname.startsWith('/chat')
                  ? 'text-primary bg-primary/5'
                  : 'text-warm-gray hover:text-warm-dark hover:bg-cream-dark'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Messages
            </Link>
          </div>
        </div>

        {/* Desktop Profile Dropdown */}
        <div className="hidden md:flex items-center">
          <ProfileMenu
            fullName={fullName}
            subtitle={roleDisplay}
            email={email}
            avatarSrc={profileImage}
            items={menuItems}
          />
        </div>

        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-warm-dark p-2 hover:bg-cream-dark rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-cream-darker animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 gap-1">
            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/dashboard' ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/trainers"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname.startsWith('/trainers') ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Trainers</span>
            </Link>
            <Link
              href="/dashboard/bookings"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname.startsWith('/dashboard/bookings') ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Bookings</span>
            </Link>
            <Link
              href="/dashboard/profile"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/dashboard/profile' ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">My Profile</span>
            </Link>
            <Link
              href="/chat"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname.startsWith('/chat') ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </Link>

            <div className="h-px bg-cream-darker my-2" />

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 p-3 text-red-500 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
