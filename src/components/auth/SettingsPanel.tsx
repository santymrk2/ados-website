"use client";

import { useState, useEffect } from "react";
import { LogOut, Palette, Save, Bell, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  TEAMS,
  getTeamColors,
  saveTeamColors,
  syncTeamConstants,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  isWebPushAvailable,
  isWebPushConfigured,
} from "@/lib/web-push-client";
import { toast } from "@/hooks/use-toast";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getContrastColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5 ? "#000000" : "#ffffff";
}

function AccordionSection({ 
  title, 
  icon: Icon, 
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon: React.ComponentType<any>; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode; 
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2 font-bold text-dark">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({ isOpen, onClose, onLogout, role = 'admin' }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogout: () => void; 
  role?: string; 
}) {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const isAdmin = role === 'admin';
  
  // Default all accordions closed
  const [openSections, setOpenSections] = useState<string[]>([]);
  
  // Push notification states
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setColors(getTeamColors());
      setSaved(false);
      setOpenSections([]);
      checkPushStatus();
    }
  }, [isOpen]);

  const checkPushStatus = async () => {
    try {
      const available = await isWebPushAvailable();
      setPushAvailable(available);
      
      if (!available) return;
      
      const configured = await isWebPushConfigured();
      setPushConfigured(configured);
      
      if (configured) {
        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('Error checking push status:', error);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleColorChange = (team: string, color: string) => {
    setColors((prev) => ({ ...prev, [team]: color }));
    setSaved(false);
  };

  const handleSave = () => {
    saveTeamColors(colors);
    syncTeamConstants();
    setSaved(true);
    toast.success("Colores guardados correctamente");
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePushSubscription = async () => {
    setIsSubscribing(true);
    setSubscriptionSaved(false);
    
    try {
      if (isSubscribed) {
        const stored = localStorage.getItem('push_subscription');
        if (stored) {
          const sub = JSON.parse(stored);
          await fetch('/api/push-subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        await unsubscribeFromPush();
        localStorage.removeItem('push_subscription');
        setIsSubscribed(false);
      } else {
        const subscriptionData = await subscribeToPush();
        
        if (subscriptionData) {
          const response = await fetch('/api/push-subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData),
          });
          
          if (response.ok) {
            localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
            setIsSubscribed(true);
          }
        }
      }
      toast.success(isSubscribed ? "Suscripción a notificaciones cancelada" : "¡Notificaciones activadas!");
      setSubscriptionSaved(true);
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error("Error al configurar notificaciones. Asegurate de dar permisos en tu navegador.");
    }
    
    setIsSubscribing(false);
    setTimeout(() => setSubscriptionSaved(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col z-[110]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Configuración
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {/* Colors Section - Only for admin */}
          {isAdmin && (
            <AccordionSection
              title="Colores de Equipos"
              icon={Palette}
              isOpen={openSections.includes('colors')}
              onToggle={() => toggleSection('colors')}
            >
              <div className="space-y-3">
                {TEAMS.map((team) => (
                  <div key={team} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{
                        backgroundColor: colors[team] || "#cccccc",
                        color: getContrastColor(colors[team] || "#cccccc"),
                      }}
                    >
                      {team}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-text-muted font-bold block mb-1">
                        Color {team}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={colors[team] || "#cccccc"}
                          onChange={(e) => handleColorChange(team, e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-none flex-shrink-0 p-0"
                          readOnly
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        />
                        <Input
                          type="text"
                          value={colors[team] || "#cccccc"}
                          onChange={(e) => handleColorChange(team, e.target.value)}
                          className="flex-1 font-mono uppercase text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSave}
                size="lg"
                className={cn(
                  "w-full gap-2 mt-4",
                  saved && "bg-green-500 hover:bg-green-600 text-white",
                )}
              >
                <Save className="w-4 h-4" />
                {saved ? "¡Guardado!" : "Guardar Colores"}
              </Button>
            </AccordionSection>
          )}

          {/* Push Notifications Section */}
          {pushAvailable && (
            <AccordionSection
              title="Notificaciones Push"
              icon={Bell}
              isOpen={openSections.includes('push')}
              onToggle={() => toggleSection('push')}
            >
              {!pushConfigured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    Las notificaciones push no están configuradas en el servidor.
                  </p>
                </div>
              ) : (
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {isSubscribed ? "Suscrito" : "No suscrito"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isSubscribed 
                          ? "Recibirás notificaciones" 
                          : "Activa para recibir notificaciones"}
                      </p>
                    </div>
                    <Button
                      onClick={handlePushSubscription}
                      disabled={isSubscribing}
                      size="sm"
                      variant={isSubscribed ? "outline" : "default"}
                      className={cn(
                        isSubscribed && "border-red-200 text-red-600 hover:bg-red-50",
                        subscriptionSaved && "bg-green-500 hover:bg-green-600 text-white"
                      )}
                    >
                      {isSubscribing ? (
                        "..."
                      ) : isSubscribed ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Desuscribirse
                        </>
                      ) : (
                        <>
                          <Bell className="w-3 h-3 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </AccordionSection>
          )}
        </div>

        {/* Logout Section - Fixed at bottom */}
        <div className="shrink-0 border-t border-surface-dark pt-4 mt-2">
          <Button
            onClick={onLogout}
            variant="destructive"
            className="w-full gap-3"
            size="lg"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
          <div className="text-center text-xs text-text-muted mt-3">
            Sesión activa por 24 horas
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
