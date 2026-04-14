"use client";

import React, { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

export default function InstallPWA() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isGenericMobile, setIsGenericMobile] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone
      || document.referrer.includes("android-app://");

    if (isStandalone) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/i.test(ua);
    const mobile = /Mobi|Tablet|iPad|iPhone|Android/i.test(ua);

    setIsIOS(ios);
    setIsGenericMobile(mobile && !ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (mobile) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        if (!deferredPrompt && (ios || (mobile && !android))) {
          setShowBanner(true);
        }
        if (mobile && !showBanner) {
            setShowBanner(true);
        }
      }, 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [deferredPrompt, showBanner]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-cream-darker p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Download className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-warm-dark">Install Askal App</h3>
            <p className="text-xs text-warm-gray mt-0.5">
              {isIOS
                ? "Add to home screen for the best experience"
                : "Book trainers faster and access offline"}
            </p>
          </div>

          <button
            onClick={dismissBanner}
            className="p-1 text-warm-gray hover:text-warm-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="w-full rounded-xl bg-primary hover:bg-primary-hover py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition-all"
            >
              Install Now
            </button>
          ) : isIOS ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-cream py-2.5 px-4 text-xs text-warm-dark border border-cream-darker">
              <span className="flex items-center gap-1 font-medium">
                Tap <Share className="h-3.5 w-3.5" />
              </span>
              <span>then &ldquo;Add to Home Screen&rdquo;</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-cream py-2.5 px-4 text-xs text-warm-dark border border-cream-darker text-center">
              <span>Open browser menu and select <br /> <b>&ldquo;Install App&rdquo;</b> or <b>&ldquo;Add to Home Screen&rdquo;</b></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
