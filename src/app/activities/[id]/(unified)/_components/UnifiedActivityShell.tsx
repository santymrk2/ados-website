"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUnifiedActivity } from "@/lib/activity-context";
import { ACTIVITY_SECTIONS, getSectionDef, type SectionId } from "@/lib/activity-sections";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { ChevronLeft, Check, Loader2, AlertCircle } from "lucide-react";
import type { Activity } from "@/lib/types";

interface UnifiedActivityShellProps {
  children: React.ReactNode;
  resolvedId: string;
  activity: Activity | undefined;
  isLoading: boolean;
  error: boolean;
}

// ── Inner component that reads context ───────────────────────────────────────

function SyncStatusBadge() {
  const { syncStatus } = useUnifiedActivity();

  const config: Record<string, { label: string; icon: typeof Check; spin: boolean }> = {
    saved: { label: "Guardado", icon: Check, spin: false },
    saving: { label: "Guardando...", icon: Loader2, spin: true },
    syncing: { label: "Sincronizando...", icon: Loader2, spin: true },
    error: { label: "Error", icon: AlertCircle, spin: false },
    conflict: { label: "Conflicto", icon: AlertCircle, spin: false },
  };

  const resolved = config[syncStatus.state] ?? config.saved;
  const Icon = resolved.icon;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled
      className="gap-1.5 bg-white/10 text-white/80 hover:bg-white/20 cursor-default shrink-0"
    >
      <Icon
        className={cn(
          "w-4 h-4",
          resolved.spin && "animate-spin",
          syncStatus.state === "error" && "text-red-300",
          syncStatus.state === "conflict" && "text-amber-300",
        )}
      />
      <span className="text-xs font-medium">{resolved.label}</span>
    </Button>
  );
}

// ── Header (used outside provider for loading/error) ─────────────────────────

function SimpleHeader({
  title,
  date,
  asistentes,
}: {
  title?: string;
  date?: string;
  asistentes?: number;
}) {
  const router = useRouter();
  return (
    <div className="pt-safe bg-primary">
      <div className="text-white p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/activities")}
            className="bg-white/20 text-white hover:bg-white/30 rounded-full shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-lg truncate">
              {title || "Actividad"}
            </h1>
            {date && (
              <div className="text-sm opacity-70 truncate">
                {formatDate(date)} · {asistentes ?? 0} presentes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export function UnifiedActivityShell({
  children,
  resolvedId,
  isLoading,
  error,
}: UnifiedActivityShellProps) {
  const router = useRouter();

  // Loading state (no context available)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white animate-pulse font-black">Cargando...</div>
        </div>
      </div>
    );
  }

  // Error state (no context available)
  if (error) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-xl font-black mb-2">Actividad no encontrada</h2>
            <Button
              variant="ghost"
              onClick={() => router.push("/activities")}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              Volver a actividades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <ShellInner resolvedId={resolvedId}>{children}</ShellInner>;
}

function ShellInner({
  children,
  resolvedId,
}: {
  children: React.ReactNode;
  resolvedId: string;
}) {
  const pathname = usePathname();
  const pathnameSection = pathname.split("/").filter(Boolean)[2] as SectionId | undefined;
  const {
    currentSection,
    setCurrentSection,
    searchQuery,
    setSearchQuery,
    filterContent,
    setFilterContent,
    filtersActive,
    setFiltersActive,
    setEditingSection,
  } = useUnifiedActivity();
  const router = useRouter();

  const [sectionLoading, setSectionLoading] = useState(false);

  // Sincroniza estado interno con la URL cuando cambia la navegación
  // Usamos queueMicrotask para evitar setState sincrónicos en el effect
  useEffect(() => {
    if (!pathnameSection || pathnameSection === currentSection) return;

    queueMicrotask(() => {
      setSectionLoading(false);
      setCurrentSection(pathnameSection);
      setSearchQuery("");
      setFilterContent(null);
      setFiltersActive(false);
      setEditingSection(null);
    });
  }, [pathnameSection, currentSection, setCurrentSection, setSearchQuery, setFilterContent, setFiltersActive, setEditingSection]);

  const handleSectionChange = useCallback(
    (newValue: string) => {
      setSectionLoading(true);
      const section = ACTIVITY_SECTIONS.find((s) => s.id === newValue);
      if (section) {
        router.push(`/activities/${resolvedId}/${section.id}`);
      }
    },
    [resolvedId, router],
  );

  const activeSection = pathnameSection ?? currentSection;
  const sectionDef = getSectionDef(activeSection);
  const hasSearch = sectionDef.hasSearch;
  const hasFilter = sectionDef.hasFilter;

  const tabs = ACTIVITY_SECTIONS.map((s) => ({
    value: s.id,
    label: s.label,
    icon: s.icon,
    href: `/activities/${resolvedId}/${s.id}`,
  }));

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="pt-safe">
        <div className="text-white p-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex-1 min-w-0">
              <ActivityTitle />
              <ActivityMeta />
            </div>
            <SyncStatusBadge />
          </div>
        </div>
      </div>

      <div className="bg-primary px-4 pt-4 flex-1 pb-32">
        {sectionLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-white" />
          </div>
        ) : (
          children
        )}
      </div>

      <FloatingNav
        value={activeSection}
        items={tabs}
        onValueChange={handleSectionChange}
        searchPlaceholder="Buscar por nombre..."
        searchValue={hasSearch ? searchQuery : undefined}
        onSearchChange={hasSearch ? setSearchQuery : undefined}
        filterContent={hasFilter ? filterContent : undefined}
        hasActiveSearch={hasSearch ? Boolean(searchQuery.trim()) : false}
        hasActiveFilters={hasFilter ? filtersActive : false}
      />
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.push("/activities")}
      className="bg-white/20 text-white hover:bg-white/30 rounded-full shrink-0"
    >
      <ChevronLeft className="w-5 h-5" />
    </Button>
  );
}

function ActivityTitle() {
  const { activity } = useUnifiedActivity();
  return (
    <h1 className="font-black text-lg truncate">
      {activity.titulo || "Actividad"}
    </h1>
  );
}

function ActivityMeta() {
  const { activity } = useUnifiedActivity();
  return (
    <div className="text-sm opacity-70 truncate">
      {formatDate(activity.fecha)} · {(activity.asistentes || []).length}{" "}
      presentes
    </div>
  );
}
