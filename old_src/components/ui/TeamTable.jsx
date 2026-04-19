"use client";

import { useMemo, useState } from "react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { SexBadge } from "./Badges";
import { Avatar } from "./Avatar";
import { Empty } from "./Common";
import { PlayerInfoModal } from "./PlayerInfoModal";
import { cn } from "@/lib/utils";

export function TeamTable({
  participants,
  act,
  onTeamChange,
  readOnly = false,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const present = useMemo(
    () =>
      participants
        .filter((p) => act.asistentes.includes(p.id))
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
    [participants, act.asistentes],
  );

  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );

  const tableData = useMemo(() => {
    return activeTeams.map((team) => {
      const members = present.filter((p) => act.equipos?.[p.id] === team);
      return {
        team,
        women: members
          .filter((p) => p.sexo === "F")
          .sort((a, b) =>
            `${a.apellido} ${a.nombre}`.localeCompare(
              `${b.apellido} ${b.nombre}`,
            ),
          ),
        men: members
          .filter((p) => p.sexo === "M")
          .sort((a, b) =>
            `${a.apellido} ${a.nombre}`.localeCompare(
              `${b.apellido} ${b.nombre}`,
            ),
          ),
      };
    });
  }, [present, act.equipos, activeTeams]);

  const unassigned = present.filter((p) => !act.equipos?.[p.id]).length;

  if (present.length === 0)
    return <Empty text="Sin asistentes en esta actividad" />;

  const handleTeamClick = (p, team) => {
    if (readOnly) {
      if (p) setSelectedPlayer(p);
      return;
    }
    if (!onTeamChange) return;
    onTeamChange(p?.id, team);
  };

  return (
    <div>
      {unassigned > 0 && !readOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 mb-3">
          ⚠ {unassigned} jugador{unassigned > 1 ? "es" : ""} sin equipo asignado
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-surface-dark">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: activeTeams.length * 110 }}
        >
          <thead>
            <tr>
              {tableData.map(({ team }) => (
                <th
                  key={team}
                  className="p-2 text-center font-black text-xs border-b border-surface-dark"
                  style={{
                    backgroundColor: getTeamBg(team),
                    color: TEAM_COLORS[team],
                    borderRight: `2px solid ${TEAM_COLORS[team]}33`,
                  }}
                >
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {tableData.map(({ team, women }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{
                    borderRight: `2px solid ${TEAM_COLORS[team]}22`,
                    backgroundColor: "#fdf2f8",
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="F" />
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">
                      Mujeres ({women.length})
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            {Array.from({
              length: Math.max(...tableData.map((c) => c.women.length), 0),
            }).map((_, rowIdx) => (
              <tr key={`w-${rowIdx}`}>
                {tableData.map(({ team, women }) => {
                  const p = women[rowIdx];
                  return (
                    <td
                      key={team}
                      className={cn(
                        "px-1 py-0.5 cursor-pointer hover:bg-pink-50",
                        rowIdx % 2 === 0 ? "bg-pink-50/10" : "bg-pink-100/30",
                      )}
                      style={{
                        borderRight: `2px solid ${TEAM_COLORS[team]}22`,
                      }}
                      onClick={() => handleTeamClick(p, team)}
                    >
                      {p ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Avatar p={p} size={24} />
                          <span className="text-xs font-bold truncate">
                            {p.nombre} {p.apellido[0]}.
                          </span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              {tableData.map(({ team, men }) => (
                <td
                  key={team}
                  className="px-1 pt-2 pb-0.5 text-center"
                  style={{
                    borderRight: `2px solid ${TEAM_COLORS[team]}22`,
                    backgroundColor: "#eff6ff",
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <SexBadge sex="M" />
                    <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide">
                      Varones ({men.length})
                    </span>
                  </div>
                </td>
              ))}
            </tr>
            {Array.from({
              length: Math.max(...tableData.map((c) => c.men.length), 0),
            }).map((_, rowIdx) => (
              <tr key={`m-${rowIdx}`}>
                {tableData.map(({ team, men }) => {
                  const p = men[rowIdx];
                  return (
                    <td
                      key={team}
                      className={cn(
                        "px-1 py-0.5 cursor-pointer hover:bg-cyan-50",
                        rowIdx % 2 === 0 ? "bg-cyan-50/10" : "bg-cyan-100/30",
                      )}
                      style={{
                        borderRight: `2px solid ${TEAM_COLORS[team]}22`,
                      }}
                      onClick={() => handleTeamClick(p, team)}
                    >
                      {p ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Avatar p={p} size={24} />
                          <span className="text-xs font-bold truncate">
                            {p.nombre} {p.apellido[0]}.
                          </span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              {tableData.map(({ team, women, men }) => (
                <td
                  key={team}
                  className="p-1.5 text-center border-t border-surface-dark"
                  style={{
                    backgroundColor: getTeamBg(team),
                    borderRight: `2px solid ${TEAM_COLORS[team]}33`,
                  }}
                >
                  <div
                    className="font-black text-base"
                    style={{ color: TEAM_COLORS[team] }}
                  >
                    {women.length + men.length}
                  </div>
                  <div className="text-[10px] text-text-muted">total</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <PlayerInfoModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
