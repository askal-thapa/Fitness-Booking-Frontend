import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-warm-darker text-cream py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 group">
            <span className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">A</span>
            ASKAL FIT
          </Link>
          <p className="text-cream-darker/70 max-w-sm leading-relaxed">
            The premium platform for booking elite fitness professionals.
            Elevate your training experience with curated experts and sophisticated technology.
          </p>
        </div>

        <div>
          <h4 className="text-primary-light font-semibold mb-6 uppercase tracking-widest text-xs">Ecosystem</h4>
          <ul className="space-y-3">
            <li><Link href="/trainers" className="text-cream-darker/60 hover:text-white transition-colors text-sm">Browse Trainers</Link></li>
            <li><Link href="/about" className="text-cream-darker/60 hover:text-white transition-colors text-sm">About Us</Link></li>
            <li><Link href="/careers" className="text-cream-darker/60 hover:text-white transition-colors text-sm">Careers</Link></li>
            <li><Link href="/contact" className="text-cream-darker/60 hover:text-white transition-colors text-sm">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-primary-light font-semibold mb-6 uppercase tracking-widest text-xs">Legal</h4>
          <ul className="space-y-3">
            <li><Link href="/privacy" className="text-cream-darker/60 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-cream-darker/60 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-cream-darker/40 text-xs">
        <p>&copy; {new Date().getFullYear()} Askal Fit. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
          <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
        </div>
      </div>
    </footer>
  );
}
