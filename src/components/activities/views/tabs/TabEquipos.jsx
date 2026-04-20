"use client";

import { useState, useMemo } from "react";
import { TEAMS, TEAM_COLORS, getTeamBg, PTS } from "@/lib/constants";
import { actPts, actGoles } from "@/lib/calc";
import { RankBadge, PodiumBadge } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Clock, BookOpen, Users } from "lucide-react";

function getPlayerPoints(pid, act, participants) {
  const a = act;
  const p = participants.find((x) => x.id === pid);
  if (!p) return { total: 0, details: [] };

  const team = a.equipos?.[pid];
  const details = [];
  let total = 0;

  if (a.asistentes.includes(pid)) {
    details.push({ label: "Asistencia", pts: PTS.asistencia });
    total += PTS.asistencia;

    if (a.puntuales.includes(pid)) {
      details.push({ label: "Puntualidad", pts: PTS.puntualidad });
      total += PTS.puntualidad;
    }
    if (a.biblias.includes(pid)) {
      details.push({ label: "Biblia", pts: PTS.biblia });
      total += PTS.biblia;
    }

    const isSocial = (a.socials || []).includes(pid);
    if (isSocial) {
      for (const _j of a.juegos || []) {
        details.push({ label: "Juego Social", pts: PTS.rec[4] || 0 });
        total += PTS.rec[4] || 0;
      }
    } else if (team) {
      for (const j of a.juegos || []) {
        let position;
        if (j.pos && typeof j.pos === "object") {
          for (const [posStr, equipos] of Object.entries(j.pos)) {
            if (Array.isArray(equipos) && equipos.includes(team)) {
              position = Number(posStr);
              break;
            }
          }
        }
        if (position !== undefined) {
          const pts = PTS.rec[position] || 0;
          details.push({ label: `${j.nombre || "Juego"} (${position}°)`, pts });
          total += pts;
        }
      }
    }

    if ((a.invitaciones || []).some((i) => i.invitador === pid)) {
      details.push({ label: "Invitación", pts: PTS.invite });
      total += PTS.invite;
    }
  }

  for (const e of a.extras || []) {
    if (e.pid === pid || (team && e.team === team)) {
      details.push({ label: e.desc || "Extra", pts: e.puntos });
      total += e.puntos;
    }
  }
  for (const d of a.descuentos || []) {
    if (d.pid === pid || (team && d.team === team)) {
      details.push({ label: d.desc || "Descuento", pts: -d.puntos });
      total -= d.puntos;
    }
  }

  const goles = actGoles(pid, a);
  if (goles > 0) {
    details.push({ label: "Goles", pts: goles });
    total += goles;
  }

  return { total, details };
}

function PlayerPointsModal({ player, act, participants, onClose }) {
  const { total, details } = useMemo(
    () => getPlayerPoints(player.id, act, participants),
    [player, act, participants],
  );

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm bg-surface rounded-3xl p-5 flex flex-col overflow-y-auto max-h-[90vh]"
      >
        <DialogTitle className="sr-only">
          Puntos de {player.nombre} {player.apellido}
        </DialogTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-surface-dark text-text-muted hover:bg-black/10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4 mb-4">
          <Avatar p={player} size={80} />
          <div>
            <h3 className="font-black text-xl text-dark">
              {player.nombre} {player.apellido}
            </h3>
            {act.equipos?.[player.id] && (
              <span
                className="text-sm font-bold"
                style={{ color: TEAM_COLORS[act.equipos[player.id]] }}
              >
                {act.equipos[player.id]}
              </span>
            )}
          </div>
        </div>

        <div className="bg-primary text-white rounded-xl p-4 text-center mb-4">
          <div className="text-3xl font-black">{total}</div>
          <div className="text-xs font-bold opacity-70">PUNTOS TOTALES</div>
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {details.map((d, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white rounded-lg p-2 border border-surface-dark"
            >
              <span className="text-sm font-medium text-dark">{d.label}</span>
              <span
                className={cn(
                  "font-black text-sm",
                  d.pts >= 0 ? "text-green-600" : "text-red-500",
                )}
              >
                {d.pts >= 0 ? "+" : ""}
                {d.pts}
              </span>
            </div>
          ))}
          {details.length === 0 && (
            <div className="text-center text-text-muted text-sm py-4">
              Sin puntos registrados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TabEquipos({ act, db, teamRank, maxTeamPts, playerRank }) {
  const participants = db.participants;
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    const present = act.asistentes
      .map((pid) => participants.find((p) => p.id === pid))
      .filter((p) => p && act.equipos?.[p.id] === selectedTeam);

    return {
      team: selectedTeam,
      women: present
        .filter((p) => p.sexo === "F")
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
      men: present
        .filter((p) => p.sexo === "M")
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
    };
  }, [selectedTeam, act, participants]);

  return (
    <div>
      <div className="flex flex-col gap-2 mb-5">
        {teamRank.map(({ team, pts }, i) => (
          <div
            key={team}
            className="rounded-2xl p-4 flex items-center gap-3 border-2 cursor-pointer hover:scale-[1.02] transition-transform"
            style={{
              backgroundColor: getTeamBg(team),
              borderColor:
                i === 0 ? TEAM_COLORS[team] : TEAM_COLORS[team] + "44",
            }}
            onClick={() => setSelectedTeam(team)}
          >
            <PodiumBadge pos={i + 1} />
            <div
              className="font-black text-xl"
              style={{ color: TEAM_COLORS[team] }}
            >
              {team}
            </div>
            <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(pts / maxTeamPts) * 100}%`,
                  backgroundColor: TEAM_COLORS[team],
                }}
              />
            </div>
            <div className="font-black text-2xl">{pts}</div>
          </div>
        ))}
      </div>

      {selectedTeam && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div
              className="font-black text-lg"
              style={{ color: TEAM_COLORS[selectedTeam] }}
            >
              {selectedTeam}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTeam(null)}
              className="text-xs text-accent hover:text-muted"
            >
              Cerrar
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {selectedTeamData && selectedTeamData.women.length > 0 && (
              <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
                <div className="font-bold text-sm text-pink-700 mb-2 flex items-center gap-2">
                  Mujer ({selectedTeamData.women.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.women.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="bg-white rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-pink-100 transition-colors"
                    >
                      <Avatar p={p} size={24} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs text-pink-600 font-bold">
                        {playerRank.find((pr) => pr.id === p.id)?.pts || 0} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTeamData && selectedTeamData.men.length > 0 && (
              <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100">
                <div className="font-bold text-sm text-cyan-700 mb-2 flex items-center gap-2">
                  Varones ({selectedTeamData.men.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.men.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="bg-white rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-cyan-100 transition-colors"
                    >
                      <Avatar p={p} size={24} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs text-cyan-600 font-bold">
                        {playerRank.find((pr) => pr.id === p.id)?.pts || 0} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTeamData &&
              selectedTeamData.women.length === 0 &&
              selectedTeamData.men.length === 0 && (
                <div className="text-accent text-center text-text-muted text-sm py-4">
                  Sin jugadores en este equipo
                </div>
              )}
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerPointsModal
          player={selectedPlayer}
          act={act}
          participants={participants}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
