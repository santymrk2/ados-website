// Edit Layout - Maneja toda la lógica compartida del formulario de edición
// Cada tab es un page independiente que usa este contexto

"use client";

import { createContext, useContext, useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { $role } from "@/store/appStore";
import { newAct } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

import {
  FileText,
  Users,
  LayoutGrid,
  Gamepad2,
  Mail,
  Trophy,
  Plus,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";

import type { Activity, Participant, DBData } from "@/lib/types";

type DbType = DBData;

// Tipos exports para los tabs
export type LocalSetter = <K extends keyof Activity>(key: K, value: Activity[K] | ((prev: Activity[K]) => Activity[K]), skipSave?: boolean) => void;
export type ServerSync = <K extends keyof Activity>(operation: string, data: unknown, field: K, newValue: Activity[K] | ((prev: Activity[K]) => Activity[K])) => Promise<unknown>;
export type SaveStatus = "saved" | "saving" | "error";

// Constantes
const EDIT_TABS = [
  { value: "", label: "General", icon: FileText },
  { value: "asistencia", label: "Asistencia", icon: Users },
  { value: "equipos", label: "Equipos", icon: LayoutGrid },
  { value: "juegos", label: "Juegos", icon: Gamepad2 },
  { value: "invitados", label: "Invitados", icon: Mail },
  { value: "goles", label: "Goles", icon: Trophy },
  { value: "extras", label: "Extras", icon: Plus },
] as const;

// Referencia para compatibilidad
const TABS = EDIT_TABS;

// Contexto compartido
export interface EditContextValue {
  activity: Activity;
  setLocal: LocalSetter;
  syncWithServer: ServerSync;
  db: DbType;
  locked: boolean;
  pendingOps: Set<string>;
}

const EditContext = createContext<EditContextValue | null>(null);

export function useEditContext() {
  const ctx = useContext(EditContext);
  if (!ctx) {
    throw new Error("useEditContext debe usarse dentro de EditLayout");
  }
  return ctx;
}

interface EditLayoutProps {
  children: React.ReactNode;
  mode?: "new" | "edit";
}

export default function EditLayout({ children, mode = "edit" }: EditLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();

  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("");

  // Resolve tab from URL pathname (more reliable than params)
  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    // pathname format: activities, [id], edit, [tab]
    // Find where we are in the path
    const editIndex = pathParts.indexOf("edit");
    const tabValue = editIndex >= 0 && editIndex + 1 < pathParts.length ? pathParts[editIndex + 1] : "";
    setCurrentTab(tabValue);
  }, [pathname]);

  // Also resolve id from params
  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) setResolvedId(id);
  }, [params?.id]);

  const { db, saveActivity, quickUpdate, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  // Estado de la actividad
  const [activity, setActivity] = useState<Activity>(() => ({ ...newAct(), id: 0 }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState<boolean>(false);

  const activityRef = useRef(activity);
  activityRef.current = activity;

  // Cargar actividad inicial
  useEffect(() => {
    if (mode === "edit" && resolvedId && db?.activities?.length) {
      const act = db.activities.find((a) => a.id === Number(resolvedId));
      if (act) {
        setActivity(act);
        setLocked(act.locked || false);
      }
    }
  }, [mode, resolvedId, db?.activities]);

  // Redireccionar si no es admin
  useEffect(() => {
    if (!isAdmin && mode === "edit" && resolvedId) {
      router.push(`/activities/${resolvedId}`);
    }
  }, [isAdmin, mode, resolvedId, router]);

  // Fix blanco al hacer scroll
  useEffect(() => {
    document.body.style.backgroundColor = "var(--background)";
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  // === FUNCIONES COMPARTIDAS ===

  // Actualiza solo estado local (sin llamada al servidor)
  const setLocal: LocalSetter = useCallback(<K extends keyof Activity>(key: K, value: Activity[K] | ((prev: Activity[K]) => Activity[K]), skipSave = false) => {
    setActivity((prev) => {
      const nextValue = typeof value === "function" 
        ? (value as (prev: Activity[K]) => Activity[K])(prev[key]) 
        : value;
      return { ...prev, [key]: nextValue };
    });
    if (!skipSave) {
      setSaveStatus("saving");
    }
    if (key === "locked") {
      setLocked((value as boolean));
    }
  }, [locked]);

  // Sincroniza cambio al servidor (PATCH atómico)
  const syncWithServer: ServerSync = useCallback(async <K extends keyof Activity>(operationType: string, data: unknown, field: K, newValue: Activity[K] | ((prev: Activity[K]) => Activity[K])) => {
    const opData = data as { juegoId?: number | string; id?: number | string; participantId?: number | string; pid?: number | string };
    const opId = opData?.juegoId || opData?.id || opData?.participantId || opData?.pid || "";
    const opKey = `${operationType}:${opId}`;

    setPendingOps((prev) => new Set([...prev, opKey]));
    
    // Resolve newValue using functional update if needed
    let resolvedValue: Activity[K];
    setActivity((prev) => {
      resolvedValue = typeof newValue === "function" 
        ? (newValue as (prev: Activity[K]) => Activity[K])(prev[field]) 
        : newValue;
      return { ...prev, [field]: resolvedValue };
    });

    // Also update locked state if field is "locked"
    if (field === "locked") {
      setLocked(newValue as boolean);
    }

    // Usar activityRef para evitar closure stale
    const currentActivity = activityRef.current;
    if (currentActivity.id) {
      try {
        const skipRefresh = ["game_pos", "game_add", "game_delete", "goal_add", "goal_remove", "extra_add", "extra_delete"].includes(operationType);
        // We pass the resolved value to quickUpdate if needed, but quickUpdate doesn't seem to use it?
        // Actually quickUpdate only takes operationType and data.
        const result = await quickUpdate(currentActivity.id, operationType, data, skipRefresh);
        toast.success("Cambios sincronizados");
        return result;
      } catch (e) {
        const err = e as Error;
        toast.error("Error al sincronizar: " + err.message);
        throw err;
      } finally {
        setPendingOps((prev) => {
          const next = new Set(prev);
          next.delete(opKey);
          return next;
        });
      }
    } else {
      setPendingOps((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  }, [quickUpdate, locked]);

  // Provider value con los nuevos nombres
  const contextValue = {
    activity,
    setLocal,
    syncWithServer,
    db,
    locked,
    pendingOps,
  };

  // Guardar toda la actividad (POST completo)
  const doSave = useCallback(async () => {
    if (!activity.fecha) return;
    setSaveStatus("saving");
    try {
      const isNew = !activity.id;
      const saved = isNew ? { ...activity, id: db.nextAid } : activity;
      const realId = await saveActivity(saved, isNew);
      if (isNew && realId) {
        setActivity((prev) => ({ ...prev, id: realId }));
        // Redireccionar a la URL con el ID correcto (General tab)
        router.replace(`/activities/${realId}/edit`);
      }
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      const err = e as Error;
      if (err.message.startsWith("VERSION_CONFLICT:")) {
        const serverVersion = err.message.split(":")[1];
        toast.error(`⚠️ Alguien más modificó esta actividad (v${serverVersion}). Recargá la página.`);
      } else {
        toast.error("Error al guardar: " + err.message);
      }
    }
  }, [activity, db.nextAid, saveActivity, router]);

  // Guardado automático en cambios
  useEffect(() => {
    if (saveStatus !== "saved" && activity.id) {
      const timer = setTimeout(doSave, 2000);
      return () => clearTimeout(timer);
    }
  }, [activity, saveStatus, doSave]);

  // Sincronizar con datos del servidor solo después de que se guarde
  // Agregar delay para evitar sobrescribir datos locales antes de que el servidor-process
  useEffect(() => {
    if (!activity.id || saveStatus !== "saved") return;
    const timer = setTimeout(() => {
      const initialActivity = db?.activities?.find((a: Activity) => a.id === activity.id);
      if (initialActivity) {
        setActivity(initialActivity);
      }
    }, 500); // 500ms delay para permitir que el servidor procese completamente
    return () => clearTimeout(timer);
  }, [db?.activities, activity.id, saveStatus]);

  // Cambio de tab
  const handleTabChange = (newTab: string) => {
    if (mode === "edit" && resolvedId) {
      // Base path sin subtab para "General" (empty string)
      const base = `/activities/${resolvedId}/edit`;
      router.push(newTab ? `${base}/${newTab}` : base);
    } else if (mode === "new") {
      router.push(`/activities/new${newTab ? `/${newTab}` : ""}`);
    } else {
      router.push(`/activities/new${newTab ? `/${newTab}` : ""}`);
    }
  };

  const handleClose = () => {
    if (mode === "edit" && activity.id) {
      router.push(`/activities/${activity.id}/view/equipos`);
    } else {
      router.push("/activities");
    }
  };

  // Loading state - esperar a que resolvingId esté disponible
  if (dbLoading || !db || (mode === "edit" && !resolvedId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && mode === "edit") {
    return null;
  }

  if (mode === "edit" && !activity.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
        </div>
      </div>
    );
  }

  // Status indicator - siempre color secondary
  const statusConfig = {
    saved: { label: "Guardado", icon: Check, animate: false },
    saving: { label: "Guardando...", icon: Loader2, animate: true },
    error: { label: "Error", icon: AlertCircle, animate: false },
  }[saveStatus] ?? { label: "", icon: Check, animate: false };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="pt-safe sticky top-0 z-10 bg-primary">
        <div className="text-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="bg-white/20 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-black text-lg truncate">
                {mode === "new" ? "Nueva Actividad" : activity.titulo || "Sin título"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-white/70">
                {activity.fecha && formatDate(activity.fecha)}
                {activity.cantEquipos && ` • ${activity.cantEquipos} equipos`}
              </div>
            </div>
            <Button
              onClick={doSave}
              variant="ghost"
              size="sm"
              disabled={saveStatus === "saving"}
              className={cn(
                "gap-1.5 bg-secondary/20 text-secondary hover:bg-secondary/30 group"
              )}
            >
              <StatusIcon className={cn("w-4 h-4 text-secondary group-hover:text-secondary", statusConfig.animate && "animate-spin")} />
              <span className="text-xs font-medium text-secondary group-hover:text-secondary">
                {statusConfig.label}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* FloatingNav en la parte inferior */}
      <FloatingNav
        value={currentTab}
        items={TABS.map((tab) => {
          const base = mode === "edit" && resolvedId
            ? `/activities/${resolvedId}/edit`
            : `/activities/new`;
          return {
            value: tab.value,
            label: tab.label,
            icon: tab.icon,
            href: tab.value ? `${base}/${tab.value}` : base,
          };
        })}
      />

      {/* Contenido del tab */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {/* Proveer contexto a los children */}
        <EditContext.Provider value={contextValue}>
          {children}
        </EditContext.Provider>
      </div>
    </div>
  );
}