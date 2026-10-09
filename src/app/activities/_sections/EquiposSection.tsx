"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";
import { TEAMS } from "@/lib/constants";
import { getContrastColor } from "@/components/teams/TeamSettingsEditor";
import { useTeamStyles } from "@/hooks/useTeamStyles";
import { actPts } from "@/lib/calc";
import { setTeamField, setTeamsBulk } from "@/lib/activity-mutates";
import { SexBadge } from "@/components/ui/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { PlayerPointsModal } from "@/app/activities/_components/PlayerPointsModal";
import { cn, normalizeText } from "@/lib/utils";
import { toolbarButtonClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
import { CountUp, EmptyBlock, Reveal } from "@/app/_components/home-ui";
import { GroupedList } from "@/components/ui/GroupedList";
import { SplitBar } from "@/components/ui/SplitBar";
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
import { Zap, Shuffle } from "lucide-react";
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
  const teams = useTeamStyles(act.teamSettings);
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
  const [saving, setSaving] = useState(false);

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
          normalizeText(`${p.nombre} ${p.apellido}`).includes(normalizeText(searchQuery))),
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
    if (locked || saving) return;
    const currentTeam = act.equipos?.[pid];
    const finalTeam = currentTeam === team ? null : team;
    setSaving(true);
    try {
      await performQuickUpdate(
        "team",
        { participantId: pid, team: finalTeam },
        undefined,
        setTeamField(pid, finalTeam),
      );
    } catch {
      // Error already handled by performQuickUpdate
    } finally {
      setSaving(false);
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
    if (locked || saving) return;
    const nextEquipos = buildBalancedTeams(resetAll);
    setSaving(true);
    try {
      await performQuickUpdate(
        "teams_bulk",
        { equipos: nextEquipos },
        undefined,
        setTeamsBulk(nextEquipos),
        (base) => ({ prevEquipos: base.equipos ?? {} }),
      );
    } catch {
      // Error already handled by performQuickUpdate
    } finally {
      setSaving(false);
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
            variant="ghost"
            size="sm"
            className={toolbarButtonClass}
          >
            Editar
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

      {/* Players per team: big total, proportional bar, then one grouped list */}
      <Reveal index={0} className="mb-6 max-w-2xl">
        <div className="flex items-baseline gap-2">
          <CountUp
            value={present.length}
            className="text-5xl font-black tracking-tight text-foreground"
          />
          <span className="text-base font-bold text-muted-foreground">
            {present.length === 1 ? "jugador" : "jugadores"}
          </span>
        </div>
        {unassignedCount > 0 && (
          <div className="mt-1 text-sm text-muted-foreground">{unassignedCount} sin equipo</div>
        )}
        <div className="mt-4">
          <SplitBar
            segments={teamStats.map(({ team, total }) => ({
              key: team,
              value: total,
              color: teams.color(team),
            }))}
          />
        </div>
      </Reveal>

      <Reveal index={1} className="mb-6 max-w-2xl">
        <GroupedList>
          {teamStats.map(({ team, total, m, f }) => {
            const selected = selectedTeam === team;
            return (
              <button
                key={team}
                type="button"
                onClick={() => handleTeamClick(team)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                  selected && "bg-muted",
                )}
                style={selected ? { boxShadow: `inset 4px 0 0 ${teams.color(team)}` } : undefined}
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{ backgroundColor: teams.color(team), color: getContrastColor(teams.color(team)) }}
                  aria-hidden
                >
                  {teams.short(team)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold leading-tight text-foreground">
                    {teams.name(team)}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <SexBadge sex="M" size={14} />
                    {m}
                    <SexBadge sex="F" size={14} className="ml-1.5" />
                    {f}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <CountUp
                    value={total}
                    className="block text-2xl font-black leading-none text-foreground"
                  />
                  <div className="mt-1 text-xs font-bold text-muted-foreground">
                    {total === 1 ? "integrante" : "integrantes"}
                  </div>
                </div>
              </button>
            );
          })}
        </GroupedList>
      </Reveal>

      {editing && (
        <div className="flex gap-2 mb-4">
          {unassignedCount > 0 && (
            <Button
              onClick={handleCompletar}
              variant="ghost"
              size="sm"
              disabled={locked || saving}
              className="flex-1 sm:flex-none bg-indigo-50 text-primary text-sm"
            >
              <Zap className="w-3 h-3" /> Completar ({unassignedCount})
            </Button>
          )}
          <Button
            onClick={handleRedistribuir}
            variant="ghost"
            size="sm"
            disabled={locked || saving}
            className="flex-1 sm:flex-none bg-red-50 text-red-500 text-sm"
          >
            <Shuffle className="w-3 h-3" /> Redistribuir
          </Button>
        </div>
      )}

      {/* Team detail */}
      {!editing && selectedTeam && selectedTeamData && (
        <Reveal key={selectedTeam} className="max-w-2xl">
          <div
            className="mb-3 text-xl font-black tracking-tight"
            style={{ color: teams.color(selectedTeam) }}
          >
            {teams.name(selectedTeam)}
          </div>
          <div className="flex flex-col gap-5">
            {[
              { sex: "F", label: "Mujeres", members: selectedTeamData.women },
              { sex: "M", label: "Varones", members: selectedTeamData.men },
            ]
              .filter((group) => group.members.length > 0)
              .map((group) => (
                <div key={group.sex}>
                  <div className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-muted-foreground">
                    <SexBadge sex={group.sex} size={16} /> {group.label} ({group.members.length})
                  </div>
                  <GroupedList>
                    {group.members.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlayer(p)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                      >
                        <Avatar p={p} size={40} />
                        <div className="min-w-0 flex-1 text-base font-bold leading-tight text-foreground">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xl font-black leading-none tabular-nums text-primary">
                            {actPts(p.id, act, db.participants)}
                          </div>
                          <div className="mt-1 text-xs font-bold text-muted-foreground">pts</div>
                        </div>
                      </button>
                    ))}
                  </GroupedList>
                </div>
              ))}
            {selectedTeamData.women.length === 0 && selectedTeamData.men.length === 0 && (
              <EmptyBlock text="Sin jugadores en este equipo" />
            )}
          </div>
        </Reveal>
      )}

      {/* Edit mode: participant list when no team selected */}
      {editing && !selectedTeam && (
        present.length === 0 ? (
          <EmptyBlock
            text={
              searchQuery
                ? "No hay jugadores que coincidan con la búsqueda"
                : "No hay jugadores presentes"
            }
          />
        ) : (
          <GroupedList>
            {present
              .filter(
                (p) =>
                  !searchQuery ||
                  normalizeText(`${p.nombre} ${p.apellido}`).includes(normalizeText(searchQuery)),
              )
              .map((p) => {
                const cur = act.equipos?.[p.id];
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
                    style={cur ? { boxShadow: `inset 4px 0 0 ${teams.color(cur)}` } : undefined}
                  >
                    <Avatar p={p} size={40} />
                    <div className="min-w-[8rem] flex-1 text-base font-bold leading-tight text-foreground">
                      {p.nombre} {p.apellido}
                    </div>
                    <div className="flex flex-wrap gap-1">
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
                          disabled={locked || saving}
                          className="rounded-full border px-3 py-1 text-sm font-bold transition active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: cur === t ? teams.color(t) : "transparent",
                            borderColor: cur === t ? teams.color(t) : teams.color(t) + "44",
                            color: cur === t ? "white" : teams.color(t),
                          }}
                        >
                          {teams.name(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </GroupedList>
        )
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
                    {teams.name(confirmChange.fromTeam)}
                  </span>{" "}
                  al equipo{" "}
                  <span className="font-bold">{teams.name(confirmChange.toTeam)}</span>
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
