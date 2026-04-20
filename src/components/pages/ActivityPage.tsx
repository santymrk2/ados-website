"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Empty } from "@/components/ui/Common";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/hooks/useAuth";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { TabEquipos } from "@/components/activities/views/tabs/TabEquipos";
import { TabGoleadores } from "@/components/activities/views/tabs/TabGoleadores";
import { TabRanking } from "@/components/activities/views/tabs/TabRanking";
import { TabAsistencia } from "@/components/activities/views/tabs/TabAsistencia";

interface ActivityPageProps {
  id: string;
  initialTab?: string;
}

export default function ActivityPage({ id, initialTab = "equipos" }: ActivityPageProps) {
  const router = useRouter();
  const { db, isLoading } = useApp();
  const { isAdmin } = useAuth();
  const { activities, participants } = db;

  // ALL hooks must be declared first - no early returns!
  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (["equipos", "asistencia", "goleadores", "juegos", "ranking"].includes(hash)) {
        return hash;
      }
    }
    return initialTab;
  });

  const [showScorers, setShowScorers] = useState(false);

  // Then all useMemo
  const act = useMemo(
    () => activities.find((a) => a.id === Number(id)),
    [activities, id],
  );

  const activeTeams = useMemo(
    () => act ? TEAMS.slice(0, act.cantEquipos || 4) : [],
    [act?.cantEquipos],
  );

  const dayPts = useMemo(
    () => act ? calcDayTeamPts(act, participants || []) : {},
    [act, participants],
  );

  const teamRank = useMemo(
    () => activeTeams.map((t) => ({ team: t, pts: dayPts[t] || 0 })).sort((a, b) => b.pts - a.pts),
    [activeTeams, dayPts],
  );

  const maxTeamPts = useMemo(
    () => teamRank.length > 0 ? Math.max(...teamRank.map((t) => t.pts), 1) : 1,
    [teamRank],
  );

  const playerRank = useMemo(
    () => act && act.asistentes
      ? act.asistentes.map((pid: number) => {
        const p = (participants || []).find((x) => x.id === pid);
        if (!p) return null;
        return { ...p, pts: actPts(pid, act, participants || []), goles: actGoles(pid, act) };
      }).filter(Boolean).sort((a: any, b: any) => b.pts - a.pts)
      : [],
    [act, participants],
  );

  const TABS = [
    { value: "equipos", label: "Equipos", icon: LayoutGrid },
    { value: "asistencia", label: "Asistencia", icon: CheckSquare },
    { value: "goleadores", label: "Goleadores", icon: Award },
    { value: "juegos", label: "Juegos", icon: Gamepad2 },
    { value: "ranking", label: "Ranking", icon: Trophy },
  ];

  const handleTabChange = (val: string) => {
    setTab(val);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${val}`);
    }
  };

  const scorersByDeporte = useMemo(() => {
    if (!act?.asistentes) return { f: [], h: [], b: [] };
    const res: Record<string, any[]> = { f: [], h: [], b: [] };
    act.asistentes.forEach((pid: number) => {
      const p = participants.find((x) => x.id === pid);
      if (!p) return;
      (["f", "h", "b"] as const).forEach((tipo) => {
        const cant = (act.goles || []).filter((g: any) => g.pid === pid && g.tipo === tipo).reduce((s: number, g: any) => s + g.cant, 0);
        if (cant > 0) res[tipo].push({ ...p, goles: cant, tipo });
      });
    });
    Object.keys(res).forEach((k: string) => res[k as keyof typeof res].sort((a: any, b: any) => b.goles - a.goles));
    return res;
  }, [act, participants]);

  // NOW render based on state - all hooks already called
  if (isLoading || !db || !db.activities) {
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

  // Main render
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="pt-safe">
        <div className="text-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">{act.titulo || "Actividad"}</div>
              <div className="text-sm opacity-70">
                {formatDate(act.fecha)} · {act.asistentes?.length || 0} presentes
              </div>
              {isAdmin() && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    router.push(`/activities/${id}/edit/info`);
                  }}
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary px-4 pt-4 flex-1">
        {tab === "equipos" && (
          <TabEquipos act={act} db={db} teamRank={teamRank} maxTeamPts={maxTeamPts} playerRank={playerRank} />
        )}
        {tab === "asistencia" && <TabAsistencia act={act} db={db} />}
        {tab === "goleadores" && (
          <TabGoleadores act={act} showScorers={showScorers} setShowScorers={setShowScorers} scorersByDeporte={scorersByDeporte} />
        )}
        {tab === "juegos" && <JuegosMixtosView act={act} juegos={act.juegos || []} />}
        {tab === "ranking" && <TabRanking playerRank={playerRank} act={act} />}
      </div>

      <FloatingNav value={tab} onValueChange={handleTabChange} items={TABS} />
    </div>
  );
}

function JuegosMixtosView({ act, juegos }: { act: any; juegos: any[] }) {
  if (!juegos?.length) return <Empty className="text-accent" text="Sin juegos registrados" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-sm text-text-muted mb-2 flex items-center gap-2">
        <Gamepad2 className="w-4 h-4" /> Juegos Mixtos
      </div>
      {juegos.map((j: any) => {
        const posToTeams: Record<string, string[]> = {};
        Object.entries(j.pos || {}).forEach(([pos, equipos]) => {
          if (!posToTeams[pos]) posToTeams[pos] = [];
          if (Array.isArray(equipos)) posToTeams[pos].push(...equipos);
        });
        const usedPositions = Object.keys(posToTeams).map(Number).sort((a, b) => a - b);

        return (
          <div key={j.id} className="bg-white rounded-xl border border-surface-dark overflow-hidden">
            <div className="p-3 border-b border-surface-dark font-bold">{j.nombre || `Juego`}</div>
            <div className="flex flex-col gap-1 p-2">
              {usedPositions.map((pos) => {
                const teams = posToTeams[pos];
                return (
                  <div key={pos} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${pos === 1 ? "bg-surface-dark" : "bg-background"}`}>
                    <div className="text-xs font-bold w-4">{pos}</div>
                    <div className="flex gap-1.5 flex-wrap flex-1">
                      {teams.map((t: string) => (
                        <span key={t} className="font-black text-sm px-2 py-0.5 rounded-lg bg-gray-100">{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}