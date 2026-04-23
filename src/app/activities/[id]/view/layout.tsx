// Layout para la vista de actividad - provee contexto
"use client";

import { createContext, useContext, useEffect, useMemo, useState, use } from "react";
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
import {
  LayoutGrid,
  Award,
  Gamepad2,
  ChevronLeft,
  Trophy,
  CheckSquare,
} from "lucide-react";
import { TEAMS } from "@/lib/constants";
import { actPts, actGoles, calcDayTeamPts } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";
import { FloatingNav } from "@/components/ui/FloatingNav";
import type { Activity, ParticipantBasic, AppState } from "@/lib/types";

// Contexto para las pages de view
export interface ViewContextValue {
  act: Activity | undefined;
  db: any;
  teamRank: { team: string; pts: number }[];
  maxTeamPts: number;
  playerRank: (ParticipantBasic & { pts: number; goles: number })[];
}

const ViewContext = createContext<ViewContextValue | null>(null);

export function useViewContext() {
  const ctx = useContext(ViewContext);
  if (!ctx) {
    throw new Error("useViewContext debe usarse dentro de ViewLayout");
  }
  return ctx;
}

const VIEW_TABS = [
  { value: "equipos", label: "Equipos", icon: LayoutGrid },
  { value: "asistencia", label: "Asistencia", icon: CheckSquare },
  { value: "goleadores", label: "Goleadores", icon: Award },
  { value: "juegos", label: "Juegos", icon: Gamepad2 },
  { value: "ranking", label: "Ranking", icon: Trophy },
] as const;

export default function ViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsAll = useParams();
  const { db, isLoading } = useApp();
  const { isAdmin } = useAuth();
  const { activities, participants } = db;

  // Resolve params
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const pathname = usePathname();
  
  // Get tab from URL pathname
  const currentTab = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart === "view" || !lastPart) return "equipos";
    return lastPart;
  }, [pathname]);

  const id = resolvedParams?.id;

  // Fix white background
  useEffect(() => {
    document.documentElement.style.backgroundColor = "var(--primary)";
    document.body.style.backgroundColor = "var(--primary)";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  const act = useMemo(
    () =>
      id && activities
        ? activities.find((a) => a.id === Number(id))
        : undefined,
    [activities, id],
  );

  const activeTeams = useMemo(
    () => (act ? TEAMS.slice(0, act.cantEquipos || 4) : []),
    [act?.cantEquipos],
  );

  const dayPts = useMemo(
    () => (act ? calcDayTeamPts(act, participants || []) : {}),
    [act, participants],
  );

  const teamRank = useMemo(
    () =>
      activeTeams
        .map((t) => ({ team: t, pts: dayPts[t] || 0 }))
        .sort((a, b) => b.pts - a.pts),
    [activeTeams, dayPts],
  );

  const maxTeamPts = useMemo(
    () => (teamRank.length > 0 ? Math.max(...teamRank.map((t) => t.pts), 1) : 1),
    [teamRank],
  );

  const playerRank = useMemo(() => {
    if (!act || !act.asistentes) return [];
    return act.asistentes
      .map((pid: number) => {
        const p = (participants || []).find((x) => x.id === pid);
        if (!p) return null;
        return {
          ...p,
          pts: actPts(pid, act, participants || []),
          goles: actGoles(pid, act),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.pts - a.pts);
  }, [act, participants]);

  const TABS = VIEW_TABS.map((tab) => ({
    ...tab,
    href: `/activities/${id}/view/${tab.value}`,
  }));



  if (isLoading || !db || !db.activities || !resolvedParams) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-white text-center">
          <p className="opacity-70">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!act) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
          <Button variant="link" onClick={() => router.push("/activities")}>
            Volver a actividades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ViewContext.Provider value={{ act, db, teamRank, maxTeamPts, playerRank }}>
      <div className="min-h-screen bg-primary flex flex-col">
        <div className="pt-safe">
          <div className="text-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/activities")}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="font-black text-lg">
                  {act.titulo || "Actividad"}
                </div>
                <div className="text-sm opacity-70">
                  {formatDate(act.fecha)} · {act.asistentes?.length || 0} presentes
                </div>
              </div>
              {isAdmin() && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/activities/${id}/edit`)}
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-primary px-4 pt-4 flex-1 pb-32">
          {children}
        </div>

        <FloatingNav value={currentTab} items={TABS} />
      </div>
    </ViewContext.Provider>
  );
}