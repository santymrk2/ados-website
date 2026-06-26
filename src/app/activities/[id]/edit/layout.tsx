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
  Volleyball,
  Plus,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";

import type { Activity, Participant, DBData } from "@/lib/types";
import { VersionConflictError } from "@/lib/errors";

type DbType = DBData;

// Tipos exports para los tabs
export type LocalSetter = <K extends keyof Activity>(key: K, value: Activity[K] | ((prev: Activity[K]) => Activity[K]), skipSave?: boolean) => void;
export type ServerSync = (operation: string, data: unknown) => Promise<unknown>;
export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

// Constantes
const EDIT_TABS = [
  { value: "", label: "General", icon: FileText },
  { value: "asistencia", label: "Asistencia", icon: Users },
  { value: "equipos", label: "Equipos", icon: LayoutGrid },
  { value: "biblia", label: "Biblia", icon: BookOpen },
  { value: "juegos", label: "Juegos", icon: Gamepad2 },
  { value: "invitados", label: "Invitados", icon: Mail },
  { value: "goles", label: "Goles",   icon: Volleyball },
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterContent: React.ReactNode;
  setFilterContent: (content: React.ReactNode) => void;
  setFiltersActive: (active: boolean) => void;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterContent, setFilterContent] = useState<React.ReactNode>(null);
  const [filtersActive, setFiltersActive] = useState(false);

  // Resolve tab from URL pathname (more reliable than params)
  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    // pathname format: activities, [id], edit, [tab]
    // Find where we are in the path
    const editIndex = pathParts.indexOf("edit");
    const tabValue = editIndex >= 0 && editIndex + 1 < pathParts.length ? pathParts[editIndex + 1] : "";
    queueMicrotask(() => setCurrentTab(tabValue));
  }, [pathname]);

  // Also resolve id from params
  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) queueMicrotask(() => setResolvedId(id));
  }, [params?.id]);

  const { db, saveActivity, quickUpdate, saveParticipant, isLoading: dbLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  // Estado de la actividad
  const [activity, setActivity] = useState<Activity>(() => ({ ...newAct(), id: 0 }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activityRef = useRef(activity);
  const lastEditTimeRef = useRef(0);
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  // Cargar actividad inicial
  useEffect(() => {
    if (mode === "edit" && resolvedId && db?.activities?.length) {
      const act = db.activities.find((a) => a.id === Number(resolvedId));
      if (act) {
        queueMicrotask(() => setActivity(act));
        queueMicrotask(() => setLocked(act.locked || false));
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
      const updated = { ...prev, [key]: nextValue };
      if (key === "locked") {
        setLocked(nextValue as boolean);
      }
      return updated;
    });
    if (!skipSave) {
      setSaveStatus("unsaved");
    }
  }, []);

  // Sincroniza cambio al servidor (PATCH atómico)
  const syncWithServer: ServerSync = useCallback(async (operationType: string, data: unknown) => {
    const opData = data as { juegoId?: number | string; id?: number | string; participantId?: number | string; pid?: number | string };
    const opId = opData?.juegoId || opData?.id || opData?.participantId || opData?.pid || "";
    const opKey = `${operationType}:${opId}`;

    setPendingOps((prev) => new Set([...prev, opKey]));
    
    // Usar activityRef para evitar closure stale
    const currentActivity = activityRef.current;
    if (currentActivity.id) {
      try {
        const result = await quickUpdate(currentActivity.id, operationType, data, currentActivity.version, true);
        if (result && typeof result === "object" && "version" in result) {
          const newVersion = (result as { version: number }).version;
          setActivity((prev) =>
            prev.id === currentActivity.id
              ? { ...prev, version: newVersion }
              : prev,
          );
          activityRef.current = { ...activityRef.current, version: newVersion };
        }
        return result;
      } catch (e) {
        if (e instanceof VersionConflictError) {
          toast.error("Otro dispositivo actualizó esta actividad. Recargamos la versión nueva.");
        } else {
          toast.error("Error al sincronizar: " + (e instanceof Error ? e.message : String(e)));
        }
        throw e;
      } finally {
        lastEditTimeRef.current = Date.now();
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
  }, [quickUpdate]);

  // Provider value con los nuevos nombres
  const contextValue = useMemo(() => ({
    activity,
    setLocal,
    syncWithServer,
    db,
    locked,
    pendingOps,
    searchQuery,
    setSearchQuery,
    filterContent,
    setFilterContent,
    setFiltersActive,
  }), [activity, setLocal, syncWithServer, db, locked, pendingOps, searchQuery, setSearchQuery, filterContent, setFilterContent, setFiltersActive]);

  const handleSearchModeChange = useCallback((open: boolean) => {
    if (!open) return;
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Guardar toda la actividad (POST completo)
  const doSave = useCallback(async () => {
    if (!activity.fecha) return;
    setSaveStatus("saving");
    try {
      const isNew = !activity.id;

      if (!isNew) {
        await quickUpdate(
          activity.id,
          "config_bulk",
          {
            titulo: activity.titulo,
            fecha: activity.fecha,
            cantEquipos: activity.cantEquipos,
            locked: activity.locked,
          },
          activity.version,
        );
        setSaveStatus("saved");
        return;
      }

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
      if (e instanceof VersionConflictError) {
        toast.error(`⚠️ Alguien más modificó esta actividad (v${e.details?.currentVersion}). Recargá la página.`);
      } else {
        toast.error("Error al guardar: " + (e instanceof Error ? e.message : String(e)));
      }
    }
  }, [activity, db.nextAid, quickUpdate, saveActivity, router]);

  // Guardado automático en cambios
  useEffect(() => {
    if (saveStatus === "unsaved" && activity.id) {
      const timer = setTimeout(doSave, 2000);
      return () => clearTimeout(timer);
    }
  }, [activity, saveStatus, doSave]);

  // Sincronizar con datos del servidor solo después de que se guarde
  // Agregar delay para evitar sobrescribir datos locales antes de que el servidor processe
  // Evitar reemplazar durante operaciones rápidas consecutivas (ej. game_pos toggles)
  useEffect(() => {
    if (!activity.id || saveStatus !== "saved" || pendingOps.size > 0) return;
    const elapsed = Date.now() - lastEditTimeRef.current;
    if (elapsed < 3000) return;
    const timer = setTimeout(() => {
      const initialActivity = db?.activities?.find((a: Activity) => a.id === activity.id);
      if (initialActivity) {
        setActivity(initialActivity);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [db?.activities, activity.id, saveStatus, pendingOps.size]);

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
  const displaySaveStatus: SaveStatus = pendingOps.size > 0 ? "saving" : saveStatus;

  const statusConfig = {
    saved: { label: "Guardado", icon: Check, animate: false },
    unsaved: { label: "Sin guardar", icon: Save, animate: false },
    saving: { label: "Guardando...", icon: Loader2, animate: true },
    error: { label: "Error", icon: AlertCircle, animate: false },
  }[displaySaveStatus] ?? { label: "", icon: Check, animate: false };

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
              disabled={displaySaveStatus === "saving"}
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
        searchValue={currentTab === "asistencia" || currentTab === "biblia" || currentTab === "equipos" ? searchQuery : undefined}
        onSearchChange={currentTab === "asistencia" || currentTab === "biblia" || currentTab === "equipos" ? setSearchQuery : undefined}
        searchPlaceholder="Buscar por nombre..."
        filterContent={filterContent ?? undefined}
        hasActiveSearch={searchQuery.trim().length > 0}
        hasActiveFilters={filtersActive}
        onSearchModeChange={handleSearchModeChange}
      />

      {/* Contenido del tab */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4 pb-20">
        {locked && (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            La actividad está bloqueada. Desbloqueala desde General para editar
            datos, asistencia, equipos y puntajes.
          </div>
        )}

        {/* Proveer contexto a los children */}
        <EditContext.Provider value={contextValue}>
          {children}
        </EditContext.Provider>
      </div>
    </div>
  );
}
