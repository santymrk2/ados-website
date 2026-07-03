"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { TEAMS, TEAM_COLORS } from "@/lib/constants";
import { actPts } from "@/lib/calc";
import { SexBadge } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { PlayerPointsModal } from "@/app/activities/_components/PlayerPointsModal";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Pencil, Zap, Shuffle } from "lucide-react";
import type { ParticipantBasic } from "@/lib/types";

export function EquiposSection() {
  const {
    activity: act,
    db,
    isAdmin,
    locked,
    searchQuery,
    performQuickUpdate,
  } = useUnifiedActivity();
  const [editing, setEditing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ParticipantBasic | null>(
    null,
  );
  const [confirmChange, setConfirmChange] = useState<{
    player: ParticipantBasic;
    fromTeam: string;
    toTeam: string;
  } | null>(null);

  const canEdit = isAdmin && !locked;
  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );

  const present = useMemo<ParticipantBasic[]>(
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

  const teamStats = activeTeams.map((t) => ({
    team: t,
    total: present.filter((p) => act.equipos?.[p.id] === t).length,
    m: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "M").length,
    f: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "F").length,
  }));

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam || !act) return null;
    const members = present.filter(
      (p) =>
        act.equipos?.[p.id] === selectedTeam &&
        (!searchQuery ||
          `${p.nombre} ${p.apellido}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())),
    );
    return {
      team: selectedTeam,
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
  }, [selectedTeam, act, present, searchQuery]);

  const setTeam = async (pid: number, team: string) => {
    const currentTeam = act.equipos?.[pid];
    const finalTeam = currentTeam === team ? null : team;

    try {
      await performQuickUpdate("team", {
        participantId: pid,
        team: finalTeam,
      });
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  const buildBalancedTeams = (resetAll = false) => {
    const eq: Record<string, string> = resetAll
      ? {}
      : Object.fromEntries(
          Object.entries(act.equipos || {}).filter(
            ([participantId, t]) =>
              activeTeams.includes(t) &&
              present.some((p) => p.id === Number(participantId)),
          ),
        );

    const counts: Record<string, { M: number; F: number; total: number }> = {};
    activeTeams.forEach((t) => {
      counts[t] = { M: 0, F: 0, total: 0 };
    });

    present.forEach((p) => {
      const t = eq[p.id];
      if (t && activeTeams.includes(t)) {
        counts[t][p.sexo as "M" | "F"]++;
        counts[t].total++;
      }
    });

    const unassigned = present.filter((p) => !eq[p.id]);
    const masc = unassigned.filter((p) => p.sexo === "M");
    const fem = unassigned.filter((p) => p.sexo === "F");

    [...masc, ...fem].forEach((p) => {
      const best = [...activeTeams].sort(
        (a, b) =>
          counts[a][p.sexo as "M" | "F"] -
            counts[b][p.sexo as "M" | "F"] ||
          counts[a].total - counts[b].total,
      )[0];
      if (!best) return;
      eq[p.id] = best;
      counts[best][p.sexo as "M" | "F"]++;
      counts[best].total++;
    });

    return eq;
  };

  const autoBalance = async (resetAll = false) => {
    const nextEquipos = buildBalancedTeams(resetAll);

    try {
      await performQuickUpdate("teams_bulk", { equipos: nextEquipos });
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  const handleCompletar = async () => {
    if (locked) return;
    const unassignedCount = present.filter((p) => !act.equipos?.[p.id]).length;
    const confirmed = await confirmDialog(
      `Se asignarán ${unassignedCount} jugadores sin equipo al equipo que más los necesita.`,
      {
        title: "Completar equipos",
        confirmText: "Completar",
        isDestructive: false,
      },
    );
    if (!confirmed) return;
    await autoBalance(false);
  };

  const handleRedistribuir = async () => {
    if (locked) return;
    const confirmed = await confirmDialog(
      "Todos los jugadores serán reasignados desde cero para lograr el mejor balance posible.",
      {
        title: "Redistribuir equipos",
        confirmText: "Redistribuir",
        isDestructive: true,
      },
    );
    if (!confirmed) return;
    await autoBalance(true);
  };

  const handleTeamClick = (team: string) => {
    if (!editing) {
      setSelectedTeam((prev) => (prev === team ? null : team));
    }
  };

  const unassignedCount = present.filter((p) => !act.equipos?.[p.id]).length;

  return (
    <div>
      {canEdit && !editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => { setEditing(true); setSelectedTeam(null); }}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>
      )}
      {editing && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setEditing(false)}
            variant="secondary"
            size="sm"
          >
            Listo
          </Button>
        </div>
      )}

      {/* Team cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {teamStats.map(({ team, total, m, f }) => (
          <div
            key={team}
            className="rounded-2xl border border-surface-dark bg-white p-3 flex items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            style={{
              borderLeftColor: TEAM_COLORS[team],
              borderLeftWidth: 4,
              ...(selectedTeam === team
                ? { boxShadow: `0 0 0 2px ${TEAM_COLORS[team]}` }
                : {}),
            }}
            onClick={() => handleTeamClick(team)}
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
                <SexBadge sex="M" size={12} />
                {m} <SexBadge sex="F" size={12} />
                {f}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex gap-2 mb-4">
          {unassignedCount > 0 && (
            <Button
              onClick={handleCompletar}
              variant="ghost"
              size="sm"
              disabled={locked}
              className="flex-1 sm:flex-none bg-indigo-50 text-primary text-xs"
            >
              <Zap className="w-3 h-3" /> Completar ({unassignedCount})
            </Button>
          )}
          <Button
            onClick={handleRedistribuir}
            variant="ghost"
            size="sm"
            disabled={locked}
            className="flex-1 sm:flex-none bg-red-50 text-red-500 text-xs"
          >
            <Shuffle className="w-3 h-3" /> Redistribuir
          </Button>
        </div>
      )}

      {/* Team detail */}
      {!editing && selectedTeam && selectedTeamData
        ? (
          <div>
            <div
              className="font-black text-lg mb-3"
              style={{ color: TEAM_COLORS[selectedTeam] }}
            >
              {selectedTeam}
            </div>
            <div className="flex flex-col gap-3">
              {selectedTeamData.women.length > 0 && (
                <div className="bg-white rounded-xl p-3 border border-surface-dark">
              <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <SexBadge sex="F" size={16} /> Mujer (
                    {selectedTeamData.women.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {selectedTeamData.women.map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          !editing && setSelectedPlayer(p)
                        }
                        className={cn(
                          "rounded-lg p-2 flex items-center gap-2",
                          !editing &&
                            "cursor-pointer hover:bg-surface-light transition-colors",
                        )}
                      >
                        <Avatar p={p} size={24} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">
                            {p.nombre} {p.apellido}
                          </div>
                        </div>
                        {!editing && (
                          <div className="text-xs font-bold text-primary">
                            {actPts(p.id, act, db.participants)} pts
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTeamData.men.length > 0 && (
                <div className="bg-white rounded-xl p-3 border border-surface-dark">
                  <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <SexBadge sex="M" size={16} /> Varón (
                    {selectedTeamData.men.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {selectedTeamData.men.map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          !editing && setSelectedPlayer(p)
                        }
                        className={cn(
                          "rounded-lg p-2 flex items-center gap-2",
                          !editing &&
                            "cursor-pointer hover:bg-surface-light transition-colors",
                        )}
                      >
                        <Avatar p={p} size={24} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">
                            {p.nombre} {p.apellido}
                          </div>
                        </div>
            {!editing && (
              <div className="text-xs font-bold text-primary">
                {actPts(p.id, act, db.participants)} pts
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )}


              {selectedTeamData.women.length === 0 &&
                selectedTeamData.men.length === 0 && (
                <div className="text-center text-white/60 text-sm py-4">
                  Sin jugadores en este equipo
                </div>
              )}
            </div>
          </div>
        )
        : !editing && (
          // Read mode: when no team selected, show nothing extra needed
          // (team cards are always visible)
          <div />
        )}

      {/* Edit mode: participant list when no team selected */}
      {editing && !selectedTeam && (
        <div className="flex flex-col gap-1">
          {present.length === 0
            ? (
              <div className="text-center text-white/60 text-sm py-4">
                {searchQuery
                  ? "No hay jugadores que coincidan con la búsqueda"
                  : "No hay jugadores presentes"}
              </div>
            )
            : (
              present
                .filter(
                  (p) =>
                    !searchQuery ||
                    `${p.nombre} ${p.apellido}`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((p) => {
                  const cur = act.equipos?.[p.id];
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-surface-dark bg-white p-3 flex items-center gap-3"
                      style={{
                        borderLeftColor: cur
                          ? TEAM_COLORS[cur]
                          : "transparent",
                        borderLeftWidth: 4,
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
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              if (cur && cur !== t) {
                                setConfirmChange({
                                  player: p,
                                  fromTeam: cur,
                                  toTeam: t,
                                });
                              } else {
                                setTeam(p.id, t);
                              }
                            }}
                            disabled={locked}
                            className="rounded-full px-3 py-1 text-xs font-bold transition border disabled:opacity-50"
                            style={{
                              backgroundColor:
                                cur === t ? TEAM_COLORS[t] : "transparent",
                              borderColor:
                                cur === t
                                  ? TEAM_COLORS[t]
                                  : TEAM_COLORS[t] + "44",
                              color:
                                cur === t ? "white" : TEAM_COLORS[t],
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
        </div>
      )}

      {selectedPlayer && !editing && (
        <PlayerPointsModal
          player={selectedPlayer}
          act={act}
          participants={db.participants}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      <AlertDialog
        open={!!confirmChange}
        onOpenChange={(open) => !open && setConfirmChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar de equipo</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmChange && (
                <>
                  <span className="font-bold">
                    {confirmChange.player.nombre}{" "}
                    {confirmChange.player.apellido}
                  </span>{" "}
                  va a pasar del equipo{" "}
                  <span className="font-bold">
                    {confirmChange.fromTeam}
                  </span>{" "}
                  al equipo{" "}
                  <span className="font-bold">{confirmChange.toTeam}</span>
                  . ¿Estás seguro?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmChange(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmChange) {
                  setTeam(confirmChange.player.id, confirmChange.toTeam);
                  setConfirmChange(null);
                }
              }}
            >
              Cambiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
