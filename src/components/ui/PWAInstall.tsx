"use client";

import { useState, useEffect } from "react";
import { Download, Share2, Smartphone } from "lucide-react";
import { Button } from "./button";

let deferredPrompt: any = null;

// Paths where PWA install should be shown
const ALLOWED_PATHS = ['/', '/activities', '/participants', '/calendar'];

export function PWAInstall() {
  const [showAndroidBtn, setShowAndroidBtn] = useState(false);
  const [showIOSBtn, setShowIOSBtn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check current path
    const path = window.location.pathname;
    const isAllowed = ALLOWED_PATHS.some(p => 
      path === p || (p !== '/' && path.startsWith(p))
    );
    setShouldShow(isAllowed);
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('pwa_install_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Android/Chrome - beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowAndroidBtn(true);
    };

    // App installed
    const handleAppInstalled = () => {
      deferredPrompt = null;
      setShowAndroidBtn(false);
      setIsInstalled(true);
    };

    // iOS detection
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS && !isStandalone) {
      setShowIOSBtn(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [shouldShow]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowAndroidBtn(false);
      setIsInstalled(true);
    }
    deferredPrompt = null;
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setDismissed(true);
  };

  // Don't render if not on allowed paths
  if (!shouldShow) return null;

  // Don't render if already installed
  if (isInstalled) return null;

  // Don't render if dismissed
  if (dismissed) return null;

  // Don't render if no buttons needed
  if (!showAndroidBtn && !showIOSBtn) return null;

  return (
    <>
      {/* Install Banner - Bottom centered */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm">
        {showAndroidBtn && (
          <div className="bg-white rounded-2xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">
                  Instalá la app en tu dispositivo
                </p>
                <p className="text-xs text-text-muted">
                  Accedé sin conexión y más rápido
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                size="sm"
              >
                Instalar
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-dark border-border"
              >
                Aceptar
              </Button>
            </div>
          </div>
        )}

        {showIOSBtn && (
          <div className="bg-white rounded-2xl shadow-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">
                  Instalá la app en tu iPhone
                </p>
                <p className="text-xs text-text-muted">
                  Desde Safari, tocáCompartir y luego "Agregar a inicio"
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => setShowIOSModal(true)}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                size="sm"
              >
                Ver pasos
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-dark border-border"
              >
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowIOSModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-background rounded-3xl p-6 max-w-sm w-full shadow-xl border border-border">
            <h3 className="font-black text-lg text-dark mb-4 text-center">
              Instalar en iPhone / iPad
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  1
                </div>
                <p className="text-sm text-dark leading-relaxed">
                  Abrí la app en <span className="font-bold">Safari</span> (no funciona en otros navegadores)
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  2
                </div>
                <p className="text-sm text-dark leading-relaxed">
                  Tocá el ícono de <Share2 className="w-4 h-4 inline" /> <span className="font-bold">Compartir</span>
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  3
                </div>
                <p className="text-sm text-dark leading-relaxed">
                  Deslizá y tocá <span className="bg-muted border border-border px-2 py-0.5 rounded-md text-xs font-bold">Agregar a inicio</span>
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  4
                </div>
                <p className="text-sm text-dark leading-relaxed">
                  Confirmá tocando <span className="font-bold">Agregar</span> arriba a la derecha
                </p>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
