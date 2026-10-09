"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, MotionConfig } from "framer-motion";
import {
  LogOut,
  Palette,
  Save,
  Bell,
  Info,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { TEAMS } from "@/lib/constants";
import { $teamDefaults } from "@/store/appStore";
import type { TeamDisplaySettings } from "@/lib/team-display";
import { TeamSettingsEditor, cleanTeamSettings } from "@/components/teams/TeamSettingsEditor";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { DetailSheet } from "../ui/DetailSheet";
import { GroupedList } from "../ui/GroupedList";
import { Switch } from "../ui/switch";
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

const APP_VERSION = "1.0.0";

/** List row: icon, label, optional current value and a chevron. */
function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  destructive = false,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted active:bg-muted"
    >
      <Icon
        className={cn("size-5 shrink-0", destructive ? "text-destructive" : "text-muted-foreground")}
      />
      <span
        className={cn(
          "flex-1 text-base font-medium",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        {label}
      </span>
      {value && <span className="text-base text-muted-foreground">{value}</span>}
      {!destructive && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
    </button>
  );
}

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
    } catch (error) {
      console.error("Push subscription error:", error);
      toast.error("Error al activar notificaciones", {
        description: "Asegurate de dar permisos en tu navegador",
      });
    }

    setIsSubscribing(false);
  };

  const sheetTitle = currentSection ? SECTION_TITLES[currentSection] : "Ajustes";

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
      headerVariant="plain"
    >
      <MotionConfig reducedMotion="user">
        {/* Slides in from the side you are navigating towards; no exit animation, so it never waits */}
        <motion.div
          key={currentSection ?? "root"}
          className="space-y-6"
          initial={{ opacity: 0, x: currentSection ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {currentSection === null && (
            <>
              {(isAdmin || pushAvailable) && (
                <GroupedList>
                  {isAdmin && (
                    <SettingsRow
                      icon={Palette}
                      label="Equipos por defecto"
                      onClick={() => setCurrentSection("colors")}
                    />
                  )}
                  {pushAvailable && (
                    <SettingsRow
                      icon={Bell}
                      label="Notificaciones Push"
                      value={
                        pushConfigured
                          ? isSubscribed
                            ? "Activadas"
                            : "Desactivadas"
                          : undefined
                      }
                      onClick={() => setCurrentSection("push")}
                    />
                  )}
                </GroupedList>
              )}

              <GroupedList>
                <SettingsRow
                  icon={Info}
                  label="Acerca de"
                  value={APP_VERSION}
                  onClick={() => setCurrentSection("about")}
                />
              </GroupedList>

              <div>
                <GroupedList>
                  <SettingsRow icon={LogOut} label="Cerrar sesión" onClick={onLogout} destructive />
                </GroupedList>
                <p className="mt-3 px-2 text-center text-xs text-muted-foreground">
                  La sesión se renueva sola mientras uses la app
                </p>
              </div>
            </>
          )}

          {currentSection === "colors" && (
            <div className="space-y-4">
              <p className="px-1 text-sm text-muted-foreground">
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
                framed
              />
              <Button
                onClick={handleSaveTeams}
                disabled={savingTeams}
                size="lg"
                className={cn(
                  "w-full gap-2",
                  saved && "bg-green-500 hover:bg-green-600 text-white",
                )}
              >
                <Save className="w-4 h-4" />
                {saved ? "¡Guardado!" : savingTeams ? "Guardando..." : "Guardar equipos"}
              </Button>
            </div>
          )}

          {currentSection === "push" &&
            (!pushConfigured ? (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  Las notificaciones push no están configuradas en el servidor.
                </p>
              </div>
            ) : (
              <GroupedList>
                <div className="flex items-center gap-3 px-4 py-4">
                  <Bell className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground">
                      {isSubscribed ? "Suscrito" : "No suscrito"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isSubscribed
                        ? "Recibirás notificaciones"
                        : "Activa para recibir notificaciones"}
                    </p>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    disabled={isSubscribing}
                    onCheckedChange={() => handlePushSubscription()}
                    aria-label="Notificaciones push"
                  />
                </div>
              </GroupedList>
            ))}

          {currentSection === "about" && (
            <GroupedList>
              <div className="flex items-center justify-between px-4 py-4 text-base">
                <span className="font-medium text-foreground">Versión</span>
                <span className="text-muted-foreground">{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-4 text-base">
                <span className="font-medium text-foreground">Desarrollado por</span>
                <span className="text-muted-foreground">ADOS Team</span>
              </div>
            </GroupedList>
          )}
        </motion.div>
      </MotionConfig>
    </DetailSheet>
  );
}
