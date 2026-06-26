"use client";

import { useState, useMemo } from "react";
import { useViewContext } from "../layout";
import { TEAMS, TEAM_COLORS } from "@/lib/constants";
import { SexBadge } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { PlayerPointsModal } from "@/app/activities/_components/PlayerPointsModal";
import type { ParticipantBasic } from "@/lib/types";

export default function EquiposPage() {
  const { act, db, playerRank } = useViewContext();
  const participants = db.participants;
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(null);

  const activeTeams = TEAMS.slice(0, act?.cantEquipos || 4);

  // Calcular stats de cada equipo
  const teamStats = useMemo(() => {
    if (!act) return [];
    return activeTeams.map((t) => {
      const members = act.asistentes
        .map((pid) => participants.find((p) => p.id === pid))
        .filter((p): p is ParticipantBasic => !!p && act.equipos?.[p.id] === t);
      return {
        team: t,
        total: members.length,
        m: members.filter((p) => p.sexo === "M").length,
        f: members.filter((p) => p.sexo === "F").length,
      };
    });
  }, [activeTeams, act, participants]);

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam || !act) return null;
    const present = act.asistentes
      .map((pid) => participants.find((p) => p.id === pid))
      .filter(
        (p): p is ParticipantBasic =>
          !!p && act.equipos?.[p.id] === selectedTeam,
      );

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
      {/* Team cards - grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {teamStats.map(({ team, total, m, f }) => (
          <div
            key={team}
            className="rounded-2xl border border-surface-dark bg-white p-3 flex items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            style={{
              borderLeftColor: TEAM_COLORS[team],
              borderLeftWidth: 4,
              ...(selectedTeam === team ? { boxShadow: `0 0 0 2px ${TEAM_COLORS[team]}` } : {}),
            }}
            onClick={() => setSelectedTeam(team)}
          >
            <div
              className="font-black text-lg shrink-0"
              style={{ color: TEAM_COLORS[team] }}
            >
              {team}
            </div>
            <div className="flex-1 text-center">
              <div className="font-black text-xl">{total}</div>
              <div className="text-[10px] text-text-muted flex items-center justify-center gap-0.5">
                <SexBadge sex="M" className="w-3 h-3" />
                {m} <SexBadge sex="F" className="w-3 h-3" />
                {f}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected team members */}
      {selectedTeam && selectedTeamData && (
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
              className="text-xs text-text-muted hover:text-primary"
            >
              Cerrar
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {selectedTeamData.women.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-surface-dark">
                <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <SexBadge sex="F" className="w-4 h-4" /> Mujer ({selectedTeamData.women.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.women.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="rounded-lg bg-white p-2 flex items-center gap-2 cursor-pointer hover:bg-surface-light transition-colors"
                    >
                      <Avatar p={p} size={24} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-primary">
                        {playerRank.find((pr) => pr.id === p.id)?.pts || 0} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTeamData.men.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-surface-dark">
                <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <SexBadge sex="M" className="w-4 h-4" /> Varón ({selectedTeamData.men.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.men.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="rounded-lg bg-white p-2 flex items-center gap-2 cursor-pointer hover:bg-surface-light transition-colors"
                    >
                      <Avatar p={p} size={24} />
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {p.nombre} {p.apellido}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-primary">
                        {playerRank.find((pr) => pr.id === p.id)?.pts || 0} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTeamData.women.length === 0 &&
              selectedTeamData.men.length === 0 && (
                <div className="text-center text-text-muted text-sm py-4">
                  Sin jugadores en este equipo
                </div>
              )}
          </div>
        </div>
      )}

      {selectedPlayer && act && (
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