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
import type { Activity, ParticipantBasic } from "@/lib/types";
import { PlayerPointsModal } from "@/components/activities/PlayerPointsModal";

interface TeamRankItem {
  team: string;
  pts: number;
}

interface PlayerRankItem extends ParticipantBasic {
  pts: number;
}



interface TabEquiposProps {
  act: Activity;
  db: { participants: ParticipantBasic[] };
  teamRank: TeamRankItem[];
  maxTeamPts: number;
  playerRank: PlayerRankItem[];
}

export function TabEquipos({ act, db, teamRank, maxTeamPts, playerRank }: TabEquiposProps) {
  const participants = db.participants;
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(null);

  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    const present = act.asistentes
      .map((pid) => participants.find((p) => p.id === pid))
      .filter((p): p is ParticipantBasic => !!p && act.equipos?.[p.id] === selectedTeam);

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
