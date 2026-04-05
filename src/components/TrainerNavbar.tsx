"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { trainerApi } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Avatar } from './ui/Avatar';

export default function TrainerNavbar() {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = session?.user as any;
  const fullName = user?.name || "Trainer";
  const roleDisplay = "Pro Trainer";

  useEffect(() => {
    if (user?.accessToken) {
      trainerApi.getMe(user.accessToken)
        .then(data => {
          if (data.imageUrl) setProfileImage(data.imageUrl);
        })
        .catch(err => console.error("Nav trainer profile fetch error:", err));
    }
  }, [user?.accessToken]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
              href="/trainer/dashboard"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                pathname === '/trainer/dashboard'
                  ? 'text-primary bg-primary/5'
                  : 'text-warm-gray hover:text-warm-dark hover:bg-cream-dark'
              }`}
            >
              Overview
            </Link>
          </div>
        </div>

        {/* Desktop Profile Actions */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs font-medium text-warm-gray hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <span>Logout</span>
            <LogOut className="w-4 h-4" />
          </button>

          <Link href="/trainer/dashboard" className="flex items-center gap-3 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-warm-dark group-hover:text-primary transition-colors">{fullName}</p>
              <p className="text-xs text-warm-gray">{roleDisplay}</p>
            </div>
            <Avatar src={profileImage} name={fullName} size="sm" />
          </Link>
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
              href="/trainer/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/trainer/dashboard' ? 'bg-primary/5 text-primary' : 'text-warm-gray hover:bg-cream-dark'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Overview</span>
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
