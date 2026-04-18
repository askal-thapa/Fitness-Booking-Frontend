"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";

export interface ProfileMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: "default" | "danger";
  divider?: boolean; // shows a divider above this item
}

interface ProfileMenuProps {
  fullName: string;
  subtitle: string;
  email?: string;
  avatarSrc?: string | null;
  items: ProfileMenuItem[];
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  fullName,
  subtitle,
  email,
  avatarSrc,
  items,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-warm-dark group-hover:text-primary transition-colors leading-tight">{fullName}</p>
          <p className="text-xs text-warm-gray leading-tight">{subtitle}</p>
        </div>
        <Avatar src={avatarSrc || undefined} name={fullName} size="sm" />
        <svg
          className={`w-4 h-4 text-warm-gray transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-cream-darker rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="p-4 border-b border-cream-darker bg-cream/40 flex items-center gap-3">
            <Avatar src={avatarSrc || undefined} name={fullName} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warm-dark truncate">{fullName}</p>
              {email && <p className="text-xs text-warm-gray truncate">{email}</p>}
            </div>
          </div>

          <div className="py-1">
            {items.map((item, idx) => {
              const cls = `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                item.variant === "danger"
                  ? "text-red-500 hover:bg-red-50"
                  : "text-warm-dark hover:bg-cream-dark"
              }`;
              const content = (
                <>
                  <span className={`shrink-0 ${item.variant === "danger" ? "text-red-500" : "text-warm-gray"}`}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </>
              );
              return (
                <React.Fragment key={item.label + idx}>
                  {item.divider && <div className="h-px bg-cream-darker my-1" />}
                  {item.href ? (
                    <Link href={item.href} className={cls} onClick={() => setOpen(false)} role="menuitem">
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={cls}
                      onClick={() => { setOpen(false); item.onClick?.(); }}
                      role="menuitem"
                    >
                      {content}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
