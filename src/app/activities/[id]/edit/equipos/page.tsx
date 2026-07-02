"use client";

import { useState, useMemo, useEffect } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Zap, Shuffle } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { SexBadge } from "@/components/ui/Badges";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
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
import type { Activity, ParticipantBasic } from "@/lib/types";

export default function EquiposPage() {
  const { activity: act, setLocal, syncWithServer, db, locked, searchQuery, setFilterContent, setFiltersActive } = useEditContext();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"apellido" | "nombre">("apellido");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [confirmChange, setConfirmChange] = useState<{
    player: ParticipantBasic;
    fromTeam: string;
    toTeam: string;
  } | null>(null);

  // Proveer filtro de orden al FloatingNav
  useEffect(() => {
    setFiltersActive(sortBy !== "apellido" || sortOrder !== "asc");
    setFilterContent(
      <div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Ordenar por
        </span>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSortBy("apellido")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortBy === "apellido"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Apellido
          </button>
          <button
            onClick={() => setSortBy("nombre")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortBy === "nombre"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Nombre
          </button>
        </div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Dirección
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder("asc")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortOrder === "asc"
                ? "bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            A→Z
          </button>
          <button
            onClick={() => setSortOrder("desc")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortOrder === "desc"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Z→A
          </button>
        </div>
      </div>,
    );
    return () => {
      setFilterContent(null);
      setFiltersActive(false);
    };
  }, [sortBy, sortOrder, setFilterContent, setFiltersActive]);

  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );

  const present = useMemo<ParticipantBasic[]>(
    () =>
      db.participants
        .filter(
          (p: ParticipantBasic) =>
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

  // Jugadores filtrados por búsqueda y ordenados
  const filteredAndSorted = useMemo(() => {
    let arr = [...present];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q),
      );
    }

    arr.sort((a, b) => {
      const nameA = sortBy === "nombre" ? `${a.nombre} ${a.apellido}` : `${a.apellido} ${a.nombre}`;
      const nameB = sortBy === "nombre" ? `${b.nombre} ${b.apellido}` : `${b.apellido} ${b.nombre}`;
      const cmp = nameA.localeCompare(nameB);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [present, searchQuery, sortBy, sortOrder]);

  const setTeam = async (pid: number, team: string) => {
    const previousEquipos = { ...(act.equipos || {}) };
    const updateFn = (prev: Record<string, string>) => {
      const next = { ...(prev || {}) };
      if (next[pid] === team) {
        delete next[pid];
      } else {
        next[pid] = team;
      }
      return next;
    };

    setLocal("equipos", updateFn, true);

    try {
      const currentTeam = act.equipos?.[pid];
      const finalTeam = currentTeam === team ? null : team;
      await syncWithServer("team", { participantId: pid, team: finalTeam });
    } catch (e) {
      setLocal("equipos", () => previousEquipos, true);
      const err = e as Error;
      toast.error("Error al actualizar equipo: " + err.message);
    }
  };

  const buildBalancedTeams = (resetAll = false) => {
    const eq: Record<string, string> = resetAll
      ? {}
      : Object.fromEntries(
        Object.entries(act.equipos || {}).filter(
          ([participantId, team]) =>
            activeTeams.includes(team) &&
            present.some((participant) => participant.id === Number(participantId)),
        ),
      ) as Record<string, string>;
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

    [...masc, ...fem].forEach((p: ParticipantBasic) => {
      const best = [...activeTeams].sort(
        (a, b) =>
          counts[a][p.sexo as "M" | "F"] - counts[b][p.sexo as "M" | "F"] ||
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
    const previousEquipos = { ...(act.equipos || {}) };
    const nextEquipos = buildBalancedTeams(resetAll);

    setLocal("equipos", () => nextEquipos, true);

    try {
      if (act.id) {
        await syncWithServer("teams_bulk", { equipos: nextEquipos });
      }
    } catch (e) {
      setLocal("equipos", () => previousEquipos, true);
      const err = e as Error;
      toast.error("Error al actualizar equipos: " + err.message);
    }
  };

  const handleCompletar = async () => {
    if (locked) return;
    const confirmed = await confirmDialog(
      `Se asignarán ${present.filter((p) => !act.equipos?.[p.id]).length} jugadores sin equipo al equipo que más los necesita.`,
      { title: "Completar equipos", confirmText: "Completar", isDestructive: false },
    );
    if (!confirmed) return;
    await autoBalance(false);
  };

  const handleRedistribuir = async () => {
    if (locked) return;
    const confirmed = await confirmDialog(
      "Todos los jugadores serán reasignados desde cero para lograr el mejor balance posible.",
      { title: "Redistribuir equipos", confirmText: "Redistribuir", isDestructive: true },
    );
    if (!confirmed) return;
    await autoBalance(true);
  };

  const teamStats = activeTeams.map((t) => ({
    team: t,
    total: present.filter((p) => act.equipos?.[p.id] === t).length,
    m: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "M").length,
    f: present.filter((p) => act.equipos?.[p.id] === t && p.sexo === "F").length,
  }));

  const unassignedCount = present.filter((p) => !act.equipos?.[p.id]).length;

  const handleTeamClick = (team: string) => {
    setSelectedTeam((prev) => (prev === team ? null : team));
  };

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;

    const sortFn = (a: ParticipantBasic, b: ParticipantBasic) => {
      const cmp = `${a.apellido} ${a.nombre}`.localeCompare(
        `${b.apellido} ${b.nombre}`,
      );
      return sortOrder === "asc" ? cmp : -cmp;
    };

    const filterFn = (p: ParticipantBasic) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return `${p.nombre} ${p.apellido}`.toLowerCase().includes(q);
    };

    return {
      women: present
        .filter(
          (p) =>
            p.sexo === "F" &&
            act.equipos?.[p.id] === selectedTeam &&
            filterFn(p),
        )
        .sort(sortFn),
      men: present
        .filter(
          (p) =>
            p.sexo === "M" &&
            act.equipos?.[p.id] === selectedTeam &&
            filterFn(p),
        )
        .sort(sortFn),
    };
  }, [selectedTeam, present, act.equipos, searchQuery, sortOrder]);

  return (
    <>
    <div>
      {/* ─── Team cards + Stats (siempre visibles arriba) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {teamStats.map(({ team, total, m, f }) => (
          <div
            key={team}
            className="rounded-2xl border border-surface-dark bg-white p-3 flex items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            style={{
              borderLeftColor: TEAM_COLORS[team],
              borderLeftWidth: 4,
              ...(selectedTeam === team ? { boxShadow: `0 0 0 2px ${TEAM_COLORS[team]}` } : {}),
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

      {/* ─── Action buttons (siempre visibles) ─── */}
      <div className="flex gap-2 mb-4">
        {unassignedCount > 0 && (
          <Button
            onClick={handleCompletar}
            variant="ghost"
            size="sm"
            disabled={locked}
            className="flex-1 bg-indigo-50 text-primary text-xs"
          >
            <Zap className="w-3 h-3" /> Completar ({unassignedCount})
          </Button>
        )}
        <Button
          onClick={handleRedistribuir}
          variant="ghost"
          size="sm"
          disabled={locked}
          className="flex-1 bg-red-50 text-red-500 text-xs"
        >
          <Shuffle className="w-3 h-3" /> Redistribuir
        </Button>
      </div>

      {/* ─── Team detail (cuando hay equipo seleccionado) ─── */}
      {selectedTeam && selectedTeamData ? (
        <div>
          <div
            className="font-black text-lg mb-3"
            style={{ color: TEAM_COLORS[selectedTeam] }}
          >
            {selectedTeam}
          </div>
          <div className="flex flex-col gap-3">
            {selectedTeamData.women.length > 0 && (
              <div className="bg-surface-light/50 rounded-xl p-3 border border-surface-dark">
                <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <SexBadge sex="F" size={16} /> Mujer ({selectedTeamData.women.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.women.map((p: ParticipantBasic) => (
                    <div
                      key={p.id}
                      className="rounded-lg p-2 flex items-center gap-2"
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
              <div className="bg-surface-light/50 rounded-xl p-3 border border-surface-dark">
                <div className="font-bold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <SexBadge sex="M" size={16} /> Varón ({selectedTeamData.men.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.men.map((p: ParticipantBasic) => (
                    <div
                      key={p.id}
                      className="rounded-lg p-2 flex items-center gap-2"
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
                <div className="text-center text-text-muted text-sm py-4">
                  Sin jugadores en este equipo
                </div>
              )}
          </div>
        </div>
      ) : (
        /* ─── List view (default cuando no hay equipo seleccionado) ─── */
        <div className="flex flex-col gap-1">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-4">
              {searchQuery
                ? "No hay jugadores que coincidan con la búsqueda"
                : "No hay jugadores presentes"}
            </div>
          ) : (
            filteredAndSorted.map((p: ParticipantBasic) => {
              const cur = act.equipos?.[p.id];
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-surface-dark bg-white p-3 flex items-center gap-3"
                  style={{
                    borderLeftColor: cur ? TEAM_COLORS[cur] : "transparent",
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
                            setConfirmChange({ player: p, fromTeam: cur, toTeam: t });
                          } else {
                            setTeam(p.id, t);
                          }
                        }}
                        disabled={locked}
                        className="rounded-full px-3 py-1 text-xs font-bold transition border disabled:opacity-50"
                        style={{
                          backgroundColor: cur === t ? TEAM_COLORS[t] : "transparent",
                          borderColor: cur === t ? TEAM_COLORS[t] : TEAM_COLORS[t] + "44",
                          color: cur === t ? "white" : TEAM_COLORS[t],
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
    </div>

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
                  <span className="font-bold">{confirmChange.player.nombre} {confirmChange.player.apellido}</span>
                  {" "}va a pasar del equipo{" "}
                  <span className="font-bold">{confirmChange.fromTeam}</span>
                  {" "}al equipo{" "}
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
    </>
  );
}
