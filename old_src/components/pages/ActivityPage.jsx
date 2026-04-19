import { useMemo, useState } from "react";
import { navigate } from "astro:transitions/client";
import {
  LayoutGrid,
  Award,
  Gamepad2,
  ChevronLeft,
  Trophy,
  CheckSquare,
} from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg, PTS } from "../../lib/constants";
import { actPts, actGoles, calcDayTeamPts } from "../../lib/calc";
import { Empty } from "../ui/Common";
import { Button } from "../ui/button";
import { PodiumBadge } from "../ui/Badges";
import { cn, formatDate } from "../../lib/utils";
import { useApp } from "../../hooks/useApp";
import { FloatingNav } from "../ui/FloatingNav";
import { TabEquipos } from "../activities/views/tabs/TabEquipos";
import { TabGoleadores } from "../activities/views/tabs/TabGoleadores";
import { TabRanking } from "../activities/views/tabs/TabRanking";
import { TabAsistencia } from "../activities/views/tabs/TabAsistencia";

export default function ActivityPage({ id, initialTab = "equipos" }) {
  const { db, refresh, isAdmin } = useApp();
  const { activities, participants } = db;

  const act = useMemo(
    () => activities.find((a) => a.id === Number(id)),
    [activities, id],
  );

  if (!act) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Actividad no encontrada</p>
          <Button
            variant="link"
            onClick={() => {
              navigate("/activities");
            }}
          >
            Volver a actividades
          </Button>
        </div>
      </div>
    );
  }

  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );
  const dayPts = useMemo(
    () => calcDayTeamPts(act, participants || []),
    [act, participants],
  );
  const teamRank = activeTeams
    .map((t) => ({ team: t, pts: dayPts[t] || 0 }))
    .sort((a, b) => b.pts - a.pts);
  const maxTeamPts = Math.max(...teamRank.map((t) => t.pts), 1);

  const playerRank = useMemo(
    () =>
      (act.asistentes || [])
        .map((pid) => {
          const p = (participants || []).find((x) => x.id === pid);
          if (!p) return null;
          return {
            ...p,
            pts: actPts(pid, act, participants || []),
            goles: actGoles(pid, act),
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.pts - a.pts),
    [act, participants],
  );

  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        ["equipos", "asistencia", "goleadores", "juegos", "ranking"].includes(
          hash,
        )
      ) {
        return hash;
      }
    }
    return initialTab;
  });

  const handleTabChange = (val) => {
    setTab(val);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${val}`);
    }
  };
  const [showScorers, setShowScorers] = useState(false);

  const TABS = [
    { value: "equipos", label: "Equipos", icon: LayoutGrid },
    { value: "asistencia", label: "Asistencia", icon: CheckSquare },
    { value: "goleadores", label: "Goleadores", icon: Award },
    { value: "juegos", label: "Juegos", icon: Gamepad2 },
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
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="pt-safe">
        <div className="text-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => history.back()}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="font-black text-lg">
                {act.titulo || "Actividad"}
              </div>
              <div className="text-sm opacity-70">
                {formatDate(act.fecha)} · {act.asistentes.length} presentes
              </div>
            </div>
            {isAdmin() && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate(`/activities/${id}/edit/info`);
                }}
              >
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

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

        {tab === "juegos" && (
          <JuegosMixtosView act={act} juegos={act.juegos || []} />
        )}

        {tab === "ranking" && <TabRanking playerRank={playerRank} act={act} />}
      </div>

      <FloatingNav value={tab} onValueChange={handleTabChange} items={TABS} />
    </div>
  );
}

function JuegosMixtosView({ act, juegos }) {
  if ((juegos || []).length === 0) {
    return <Empty className="text-accent" text="Sin juegos registrados" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-sm text-text-muted mb-2 flex items-center gap-2">
        <Gamepad2 className="w-4 h-4" /> Juegos Mixtos
      </div>
      {juegos.map((j, gi) => {
        // j.pos = { 1: ["E1", "E2"], 2: ["E3"], 3: ["E4"] }
        const posToTeams = {};
        Object.entries(j.pos || {}).forEach(([pos, equipos]) => {
          if (!posToTeams[pos]) posToTeams[pos] = [];
          if (Array.isArray(equipos)) {
            posToTeams[pos].push(...equipos);
          }
        });

        const usedPositions = Object.keys(posToTeams)
          .map(Number)
          .sort((a, b) => a - b);

        return (
          <div
            key={j.id}
            className="bg-white rounded-xl border border-surface-dark overflow-hidden"
          >
            <div className="p-3 border-b border-surface-dark font-bold">
              {j.nombre || `Juego ${gi + 1}`}
            </div>
            {usedPositions.length === 0 ? (
              <div className="p-3 text-xs text-text-muted text-center opacity-60">
                Sin posiciones registradas
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {usedPositions.map((pos) => {
                  const teams = posToTeams[pos];
                  return (
                    <div
                      key={pos}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                        pos === 1 ? "bg-surface-dark" : "bg-background",
                      )}
                    >
                      <PodiumBadge pos={pos} className="w-5 h-5 text-[10px]" />
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {teams.map((t) => (
                          <span
                            key={t}
                            className="font-black text-sm px-2 py-0.5 rounded-lg"
                            style={{
                              color: TEAM_COLORS[t],
                              backgroundColor: getTeamBg(t),
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-text-muted font-bold flex-shrink-0">
                        +{PTS.rec[pos] || 0} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
