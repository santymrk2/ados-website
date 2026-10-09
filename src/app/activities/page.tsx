"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import { MotionConfig } from "framer-motion";
import { Lock, Search, ChevronRight } from "lucide-react";
import { Empty } from "@/components/ui/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { GroupedList } from "@/components/ui/GroupedList";
import { CountUp, Reveal } from "@/app/_components/home-ui";
import { NewActivityModal } from "./_components/NewActivityModal";
import { formatDate, normalizeText, parseLocalDate } from "@/lib/utils";
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
  // parseLocalDate avoids the UTC shift of new Date("YYYY-MM-DD")
  const date = parseLocalDate(activity.fecha);
  const attendees = (activity.asistentes || []).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted active:bg-muted"
    >
      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted">
        <span className="text-lg font-black leading-none tabular-nums text-foreground">
          {date ? date.getDate() : "–"}
        </span>
        <span className="mt-0.5 text-[10px] font-bold uppercase leading-none text-muted-foreground">
          {date ? MONTHS[date.getMonth()].slice(0, 3) : ""}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold leading-tight text-foreground">
          {activity.titulo || "Sin título"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{formatDate(activity.fecha)}</div>
      </div>
      {activity.locked && <Lock className="size-4 shrink-0 text-muted-foreground" />}
      <div className="shrink-0 text-right">
        <div className="text-xl font-black leading-none tabular-nums text-foreground">
          {attendees}
        </div>
        <div className="mt-1 text-xs font-bold text-muted-foreground">
          {attendees === 1 ? "presente" : "presentes"}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ActivitiesSkeleton() {
  return (
    <div className="max-w-3xl space-y-4 p-4">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <Skeleton className="h-11 w-full rounded-full" />
      {[1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-36 w-full rounded-3xl" />
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
    const q = normalizeText(search);
    return sorted.filter(
      (a) =>
        normalizeText(a.titulo || "").includes(q) ||
        normalizeText(formatDate(a.fecha)).includes(q),
    );
  }, [db.activities, search]);

  const groupedByMonth = useMemo(() => {
    const groups: { label: string; activities: Activity[] }[] = [];
    let currentLabel = "";

    filtered.forEach((a) => {
      // parseLocalDate avoids the UTC shift of new Date("YYYY-MM-DD") that moves day 1 to the previous month
      const d = parseLocalDate(a.fecha);
      if (!d) return;
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
    <MotionConfig reducedMotion="user">
    <div className="max-w-3xl">
      <Reveal index={0} className="px-4 pt-3">
        <div className="flex items-baseline gap-2">
          <CountUp
            value={db.activities.length}
            className="text-5xl font-black tracking-tight text-foreground"
          />
          <span className="text-base font-bold text-muted-foreground">
            {db.activities.length === 1 ? "actividad registrada" : "actividades registradas"}
          </span>
        </div>
      </Reveal>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar actividad..."
            className="h-11 rounded-full border-0 bg-muted pl-11"
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
          <div className="space-y-6">
            {groupedByMonth.map((group, i) => (
              <Reveal key={group.label} index={i + 1}>
                <div className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
                <GroupedList>
                  {group.activities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      onClick={() => router.push(`/activities/${a.id}`)}
                    />
                  ))}
                </GroupedList>
              </Reveal>
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
    </MotionConfig>
  );
}
