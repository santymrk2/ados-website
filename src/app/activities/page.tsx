"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import { Lock, Search, ChevronRight } from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { NewActivityModal } from "./_components/NewActivityModal";
import { formatDate, cn } from "@/lib/utils";
import { $role } from "@/store/appStore";
import { useApp } from "@/hooks/useApp";
import type { Activity } from "@/lib/types";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ActivityRow({
  activity,
  onClick,
}: {
  activity: Activity;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-xl p-3 border border-border flex items-center gap-3 text-left cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">
          {activity.titulo || "Sin título"}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDate(activity.fecha)}
        </div>
      </div>
      {activity.locked && (
        <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function ActivitiesSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function ActivitiesPage() {
  const router = useRouter();
  const { db, isLoading } = useApp();
  const role = useStore($role);
  const isAdmin = role === "admin";

  const [newActivityOpen, setNewActivityOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...db.activities].sort(
      (a, b) => b.fecha.localeCompare(a.fecha),
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (a) =>
        (a.titulo || "").toLowerCase().includes(q) ||
        formatDate(a.fecha).toLowerCase().includes(q),
    );
  }, [db.activities, search]);

  const groupedByMonth = useMemo(() => {
    const groups: { label: string; activities: Activity[] }[] = [];
    let currentLabel = "";

    filtered.forEach((a) => {
      const d = new Date(a.fecha);
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, activities: [] });
      }
      groups[groups.length - 1].activities.push(a);
    });

    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <>
        <ActivitiesSkeleton />
      </>
    );
  }

  return (
    <div>
      <div className="px-4 pt-2 pb-1 text-xs font-bold text-muted-foreground">
        {db.activities.length} registradas
      </div>

      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar actividad..."
            className="pl-10"
          />
        </div>

        {db.activities.length === 0 ? (
          <div className="text-center py-8">
            <Empty text="No hay actividades" />
            {isAdmin && (
              <Button
                onClick={() => setNewActivityOpen(true)}
                className="mt-4"
                size="lg"
              >
                Crear primera actividad
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <Empty text="No se encontraron resultados" />
        ) : (
          <div className="space-y-4">
            {groupedByMonth.map((group) => (
              <div key={group.label}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                  {group.label}
                </div>
                <div className="flex flex-col gap-2">
                  {group.activities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      onClick={() => router.push(`/activities/${a.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={() => setNewActivityOpen(true)}
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
          >
            <span className="text-xl font-bold">+</span>
          </Button>
        </div>
      )}

      <NewActivityModal open={newActivityOpen} onOpenChange={setNewActivityOpen} />
    </div>
  );
}
