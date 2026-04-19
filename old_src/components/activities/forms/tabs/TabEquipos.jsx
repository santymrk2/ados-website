"use client";

import { useState, useMemo } from "react";
import { toast } from "../../../../hooks/use-toast";
import { List, Users, Zap, Shuffle } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "../../../ui/button";
import { Avatar } from "../../../ui/Avatar";
import { SexBadge } from "../../../ui/Badges";

export function TabEquipos({ act, A, Q, db, locked = false }) {
  const [viewMode, setViewMode] = useState("cards");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );

  const present = useMemo(
    () =>
      db.participants
        .filter(
          (p) =>
            act.asistentes.includes(p.id) &&
            !(act.socials || []).includes(p.id),
        )
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
    [db.participants, act.asistentes, act.socials],
  );

  const setTeam = (pid, team) => {
    const eq = { ...(act.equipos || {}) };
    let finalTeam = team;
    if (eq[pid] === team) {
      delete eq[pid];
      finalTeam = null;
    } else {
      eq[pid] = team;
    }
    Q("team", { participantId: pid, team: finalTeam }, "equipos", eq);
    toast.success("Equipo actualizado");
  };

  const autoBalance = (resetAll = false) => {
    const eq = resetAll ? {} : { ...(act.equipos || {}) };
    const counts = {};
    activeTeams.forEach((t) => {
      counts[t] = { M: 0, F: 0, total: 0 };
    });
    if (!resetAll) {
      present.forEach((p) => {
        const t = eq[p.id];
        if (t && activeTeams.includes(t)) {
          counts[t][p.sexo]++;
          counts[t].total++;
        }
      });
    }
    const unassigned = present.filter((p) => !eq[p.id]);
    const masc = unassigned.filter((p) => p.sexo === "M");
    const fem = unassigned.filter((p) => p.sexo === "F");

    [...masc, ...fem].forEach((p) => {
      const best = [...activeTeams].sort(
        (a, b) =>
          counts[a][p.sexo] - counts[b][p.sexo] ||
          counts[a].total - counts[b].total,
      )[0];
      eq[p.id] = best;
      counts[best][p.sexo]++;
      counts[best].total++;
    });
    A("equipos", eq);
    toast.success(resetAll ? "Equipos redistribuidos" : "Equipos completados");
  };

  const teamStats = activeTeams.map((t) => ({
    team: t,
    total: present.filter((p) => act.equipos?.[p.id] === t).length,
    m: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "M")
      .length,
    f: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "F")
      .length,
  }));
  const unassignedCount = present.filter((p) => !act.equipos?.[p.id]).length;

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    return {
      women: present
        .filter((p) => p.sexo === "F" && act.equipos?.[p.id] === selectedTeam)
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
      men: present
        .filter((p) => p.sexo === "M" && act.equipos?.[p.id] === selectedTeam)
        .sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
          ),
        ),
    };
  }, [selectedTeam, present, act.equipos]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button
          onClick={() => {
            setSelectedTeam(null);
            setViewMode("cards");
          }}
          variant={viewMode === "cards" ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-1 rounded-xl font-bold text-xs"
        >
          <Users className="w-3.5 h-3.5" /> Cards
        </Button>
        <Button
          onClick={() => {
            setSelectedTeam(null);
            setViewMode("list");
          }}
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-1 rounded-xl font-bold text-xs"
        >
          <List className="w-3.5 h-3.5" /> Lista
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {unassignedCount > 0 && (
          <Button
            onClick={() => autoBalance(false)}
            variant="ghost"
            size="sm"
            disabled={locked}
            className="flex-1 bg-indigo-50 text-primary text-xs"
          >
            <Zap className="w-3 h-3" /> Completar ({unassignedCount})
          </Button>
        )}
        <Button
          onClick={() => autoBalance(true)}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="flex-1 bg-red-50 text-red-500 text-xs"
        >
          <Shuffle className="w-3 h-3" /> Redistribuir
        </Button>
      </div>

      {viewMode === "cards" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {teamStats.map(({ team, total, m, f }) => (
              <div
                key={team}
                className="rounded-2xl p-3 flex items-center gap-2 border-2 cursor-pointer hover:scale-[1.02] transition-transform"
                style={{
                  backgroundColor: getTeamBg(team),
                  borderColor:
                    selectedTeam === team
                      ? TEAM_COLORS[team]
                      : TEAM_COLORS[team] + "44",
                }}
                onClick={() => setSelectedTeam(team)}
              >
                <div
                  className="font-black text-lg"
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

          {selectedTeam && selectedTeamData && (
            <div>
              <div
                className="font-black text-lg mb-3"
                style={{ color: TEAM_COLORS[selectedTeam] }}
              >
                {selectedTeam}
              </div>
              <div className="flex flex-col gap-3">
                {selectedTeamData.women.length > 0 && (
                  <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
                    <div className="font-bold text-sm text-pink-700 mb-2 flex items-center gap-2">
                      Mujer ({selectedTeamData.women.length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {selectedTeamData.women.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white rounded-lg p-2 flex items-center gap-2"
                        >
                          <Avatar p={p} size={24} />
                          <div className="flex-1">
                            <div className="font-bold text-sm">
                              {p.nombre} {p.apellido}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTeamData.men.length > 0 && (
                  <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-100">
                    <div className="font-bold text-sm text-cyan-700 mb-2 flex items-center gap-2">
                      Varón ({selectedTeamData.men.length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {selectedTeamData.men.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white rounded-lg p-2 flex items-center gap-2"
                        >
                          <Avatar p={p} size={24} />
                          <div className="flex-1">
                            <div className="font-bold text-sm">
                              {p.nombre} {p.apellido}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTeamData.women.length === 0 &&
                  selectedTeamData.men.length === 0 && (
                    <div className="text-accent text-center text-text-muted text-sm py-4">
                      Sin jugadores en este equipo
                    </div>
                  )}
              </div>
            </div>
          )}
        </>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-1">
          {present.map((p) => {
            const cur = act.equipos?.[p.id];
            return (
              <div
                key={p.id}
                className="bg-white rounded-lg p-3 flex items-center gap-3 border"
                style={{
                  borderColor: cur ? TEAM_COLORS[cur] + "55" : "#e5e5e5",
                }}
              >
                <Avatar p={p} size={32} />
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {p.nombre} {p.apellido}
                  </div>
                </div>
                <div className="flex gap-1">
                  {activeTeams.map((t) => (
                    <Button
                      key={t}
                      onClick={() => setTeam(p.id, t)}
                      variant="ghost"
                      size="sm"
                      disabled={locked}
                      className="w-8 h-7 rounded font-black text-[10px] p-0"
                      style={{
                        backgroundColor:
                          cur === t ? TEAM_COLORS[t] : getTeamBg(t),
                        color: cur === t ? "white" : "#666",
                      }}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
