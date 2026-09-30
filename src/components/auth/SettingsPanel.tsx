"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  Palette,
  Save,
  Bell,
  X,
  Info,
  ChevronRight,
} from "lucide-react";
import { TEAMS } from "@/lib/constants";
import { $teamDefaults } from "@/store/appStore";
import type { TeamDisplaySettings } from "@/lib/team-display";
import { TeamSettingsEditor, cleanTeamSettings } from "@/components/teams/TeamSettingsEditor";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { DetailSheet } from "../ui/DetailSheet";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  isWebPushAvailable,
  isWebPushConfigured,
} from "@/services/web-push-client";
import { toast } from "@/hooks/use-toast";

const SECTION_TITLES: Record<string, string> = {
  colors: "Equipos por defecto",
  push: "Notificaciones Push",
  about: "Acerca de",
};

export function SettingsPanel({
  isOpen,
  onClose,
  onLogout,
  role = "admin",
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  role?: string;
}) {
  const [teamDraft, setTeamDraft] = useState<TeamDisplaySettings>({});
  const [savingTeams, setSavingTeams] = useState(false);
  const [saved, setSaved] = useState(false);
  const isAdmin = role === "admin";

  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);

  const checkPushStatus = useCallback(async () => {
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
      console.error("Error checking push status:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setTeamDraft($teamDefaults.get());
        setSaved(false);
        setCurrentSection(null);
      });
      queueMicrotask(() => checkPushStatus());
    }
  }, [isOpen, checkPushStatus]);

  // Shared defaults for every activity (stored in the DB, not per device)
  const handleSaveTeams = async () => {
    const teams = cleanTeamSettings(teamDraft);
    setSavingTeams(true);
    try {
      const res = await fetch("/api/settings/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudieron guardar los equipos");
      $teamDefaults.set(teams);
      setTeamDraft(teams);
      setSaved(true);
      toast.success("Equipos por defecto guardados", {
        description: "Se aplican a todas las actividades que no tengan los suyos",
      });
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar los equipos");
    } finally {
      setSavingTeams(false);
    }
  };

  const handlePushSubscription = async () => {
    setIsSubscribing(true);
    setSubscriptionSaved(false);

    try {
      if (isSubscribed) {
        const stored = localStorage.getItem("push_subscription");
        if (stored) {
          const sub = JSON.parse(stored);
          await fetch("/api/push-subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        await unsubscribeFromPush();
        localStorage.removeItem("push_subscription");
        setIsSubscribed(false);
      } else {
        const subscriptionData = await subscribeToPush();

        if (!subscriptionData) {
          throw new Error("No se pudo crear la suscripción push");
        }

        const response = await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscriptionData),
        });

        if (!response.ok) {
          // Don't leave a browser subscription the server doesn't know about
          await unsubscribeFromPush();
          throw new Error("El servidor rechazó la suscripción push");
        }

        localStorage.setItem(
          "push_subscription",
          JSON.stringify(subscriptionData),
        );
        setIsSubscribed(true);
      }
      toast.success(
        isSubscribed
          ? "Notificaciones desactivadas"
          : "Notificaciones activadas",
        {
          description: isSubscribed
            ? "Ya no recibirás notificaciones push"
            : "Recibirás notificaciones cuando haya cumpleños",
        },
      );
      setSubscriptionSaved(true);
    } catch (error) {
      console.error("Push subscription error:", error);
      toast.error("Error al activar notificaciones", {
        description: "Asegurate de dar permisos en tu navegador",
      });
    }

    setIsSubscribing(false);
    setTimeout(() => setSubscriptionSaved(false), 2000);
  };

  const sheetTitle = currentSection ? SECTION_TITLES[currentSection] : "Configuración";

  return (
    <DetailSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (currentSection) {
            setCurrentSection(null);
          } else {
            onClose();
          }
        }
      }}
      title={sheetTitle}
    >
      <div className="space-y-3">
        {currentSection === null && (
          <>
            {isAdmin && (
              <button
                onClick={() => setCurrentSection("colors")}
                className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/15 text-left transition-colors hover:bg-primary/15"
              >
                <Palette className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-dark">Equipos por defecto</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </button>
            )}

            {pushAvailable && (
              <button
                onClick={() => setCurrentSection("push")}
                className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/15 text-left transition-colors hover:bg-primary/15"
              >
                <Bell className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-dark">Notificaciones Push</div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </button>
            )}

            <button
              onClick={() => setCurrentSection("about")}
              className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/15 text-left transition-colors hover:bg-primary/15"
            >
              <Info className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="font-bold text-sm text-dark">Acerca de</div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>

            <div className="border-t border-surface-dark pt-4 mt-4">
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
                La sesión se renueva sola mientras uses la app
              </div>
            </div>
          </>
        )}

        {currentSection === "colors" && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">
              Nombres y colores que usan todas las actividades. Cada actividad puede cambiarlos desde General.
            </p>
            <TeamSettingsEditor
              teams={TEAMS}
              value={teamDraft}
              onChange={(next) => {
                setTeamDraft(next);
                setSaved(false);
              }}
              disabled={savingTeams}
            />
            <Button
              onClick={handleSaveTeams}
              disabled={savingTeams}
              size="lg"
              className={cn(
                "w-full gap-2 mt-4",
                saved && "bg-green-500 hover:bg-green-600 text-white",
              )}
            >
              <Save className="w-4 h-4" />
              {saved ? "¡Guardado!" : savingTeams ? "Guardando..." : "Guardar equipos"}
            </Button>
          </div>
        )}

        {currentSection === "push" && (
          <>
            {!pushConfigured ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  Las notificaciones push no están configuradas en el servidor.
                </p>
              </div>
            ) : (
              <div className="bg-surface-dark rounded-xl p-4">
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
                      isSubscribed &&
                        "border-red-200 text-red-600 hover:bg-red-50",
                      subscriptionSaved &&
                        "bg-green-500 hover:bg-green-600 text-white",
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
          </>
        )}

        {currentSection === "about" && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Versión</span>
              <span className="font-medium text-dark">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Desarrollado por</span>
              <span className="font-medium text-dark">ADOS Team</span>
            </div>
          </div>
        )}
      </div>
    </DetailSheet>
  );
}
