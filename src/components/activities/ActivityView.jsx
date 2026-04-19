"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Award,
  Gamepad2,
  ChevronLeft,
  Trophy,
  CheckSquare,
} from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { actPts, actGoles, calcDayTeamPts } from "@/lib/calc";
import { Empty } from "../ui/Common";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/button";

import { cn, formatDate } from "@/lib/utils";
import { FloatingNav } from "../ui/FloatingNav";

// Import modularized view tab components
import { TabEquipos } from "./views/tabs/TabEquipos";
import { TabGoleadores } from "./views/tabs/TabGoleadores";
import { TabPartidos } from "./views/tabs/TabPartidos";
import { TabRanking } from "./views/tabs/TabRanking";
import { TabAsistencia } from "./views/tabs/TabAsistencia";

export function ActivityViewModal({
  db,
  act,
  onEdit,
  onClose,
  initialTab = "equipos",
}) {
  const { participants } = db;
  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );
  const dayPts = useMemo(
    () => calcDayTeamPts(act, participants),
    [act, participants],
  );
  const teamRank = activeTeams
    .map((t) => ({ team: t, pts: dayPts[t] || 0 }))
    .sort((a, b) => b.pts - a.pts);
  const maxTeamPts = Math.max(...teamRank.map((t) => t.pts), 1);

  const playerRank = useMemo(
    () =>
      act.asistentes
        .map((pid) => {
          const p = participants.find((x) => x.id === pid);
          if (!p) return null;
          return {
            ...p,
            pts: actPts(pid, act, participants),
            goles: actGoles(pid, act),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.pts - a.pts),
    [act, participants],
  );

  const [showScorers, setShowScorers] = useState(false);
  const [tab, setTab] = useState(initialTab);

  const TABS = [
    { value: "asistencia", label: "Asistencia", icon: CheckSquare },
    { value: "equipos", label: "Equipos", icon: LayoutGrid },
    { value: "goleadores", label: "Goleadores", icon: Award },
    { value: "partidos", label: "Partidos", icon: Gamepad2 },
    { value: "ranking", label: "Ranking", icon: Trophy },
  ];

  const scorersByDeporte = useMemo(() => {
    const res = { f: [], h: [], b: [] };
    act.asistentes.forEach((pid) => {
      const p = participants.find((x) => x.id === pid);
      if (!p) return;
      ["f", "h", "b"].forEach((tipo) => {
        const cant = (act.goles || [])
          .filter((g) => g.pid === pid && g.tipo === tipo)
          .reduce((s, g) => s + g.cant, 0);
        if (cant > 0) {
          res[tipo].push({ ...p, goles: cant, tipo });
        }
      });
    });
    Object.keys(res).forEach((k) => res[k].sort((a, b) => b.goles - a.goles));
    return res;
  }, [act, participants]);

  return (
    <div className="fixed inset-0 bg-primary z-50 overflow-y-auto">
      <div className="pt-safe">
        <div className="text-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="bg-white/20 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">
                {act.titulo || "Actividad"}
              </div>
              <div className="text-xs opacity-70">
                {formatDate(act.fecha)} · {act.asistentes.length} presentes
              </div>
            </div>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="text-accent border-white/30 hover:bg-white/20"
            >
              Editar
            </Button>
          </div>
        </div>
      </div>

      <FloatingNav value={tab} onValueChange={setTab} items={TABS} />

      <div className="bg-primary px-4 pt-4 flex-1">
        {tab === "equipos" && (
          <TabEquipos
            act={act}
            db={db}
            teamRank={teamRank}
            maxTeamPts={maxTeamPts}
            playerRank={playerRank}
          />
        )}

        {tab === "asistencia" && <TabAsistencia act={act} db={db} />}

        {tab === "goleadores" && (
          <TabGoleadores
            act={act}
            showScorers={showScorers}
            setShowScorers={setShowScorers}
            scorersByDeporte={scorersByDeporte}
          />
        )}

        {tab === "partidos" && <TabPartidos partidos={act.partidos || []} />}

        {tab === "ranking" && <TabRanking playerRank={playerRank} act={act} />}
      </div>
    </div>
  );
}
