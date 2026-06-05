"use client";

import { useState, useMemo, useEffect } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Zap, Shuffle } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
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
  const { activity: act, setLocal, syncWithServer, db, locked, searchQuery, setFilterContent } = useEditContext();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [confirmChange, setConfirmChange] = useState<{
    player: ParticipantBasic;
    fromTeam: string;
    toTeam: string;
  } | null>(null);

  // Proveer filtro de orden al FloatingNav
  useEffect(() => {
    setFilterContent(
      <div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Orden alfabético
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder("asc")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortOrder === "asc"
                ? "bg-primary text-white border-primary"
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
    return () => setFilterContent(null);
  }, [sortOrder, setFilterContent]);

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
      const cmp = `${a.apellido} ${a.nombre}`.localeCompare(
        `${b.apellido} ${b.nombre}`,
      );
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [present, searchQuery, sortOrder]);

  const setTeam = async (pid: number, team: string) => {
    const updateFn = (prev: Record<string, string>) => {
      const next = { ...(prev || {}) };
      if (next[pid] === team) {
        delete next[pid];
      } else {
        next[pid] = team;
      }
      return next;
    };

    setLocal("equipos", updateFn);

    try {
      const currentTeam = act.equipos?.[pid];
      const finalTeam = currentTeam === team ? null : team;
      await syncWithServer("team", { participantId: pid, team: finalTeam }, "equipos", updateFn);
      toast.success("Equipo actualizado");
    } catch (e) {
      const err = e as Error;
      toast.error("Error al actualizar equipo: " + err.message);
    }
  };

  const autoBalance = (resetAll = false) => {
    setLocal("equipos", (prev: Record<string, string>) => {
      const eq = resetAll ? {} : { ...(prev || {}) };
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
        eq[p.id] = best;
        counts[best][p.sexo as "M" | "F"]++;
        counts[best].total++;
      });
      return eq;
    });
    toast.success(resetAll ? "Equipos redistribuidos" : "Equipos completados");
  };

  const handleCompletar = async () => {
    if (locked) return;
    const confirmed = await confirmDialog(
      `Se asignarán ${present.filter((p) => !act.equipos?.[p.id]).length} jugadores sin equipo al equipo que más los necesita.`,
      { title: "Completar equipos", confirmText: "Completar", isDestructive: false },
    );
    if (!confirmed) return;
    autoBalance(false);
  };

  const handleRedistribuir = async () => {
    if (locked) return;
    const confirmed = await confirmDialog(
      "Todos los jugadores serán reasignados desde cero para lograr el mejor balance posible.",
      { title: "Redistribuir equipos", confirmText: "Redistribuir", isDestructive: true },
    );
    if (!confirmed) return;
    autoBalance(true);
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
            className="rounded-2xl p-3 flex items-center gap-2 border-2 cursor-pointer hover:scale-[1.02] transition-transform"
            style={{
              backgroundColor: getTeamBg(team),
              borderColor:
                selectedTeam === team
                  ? TEAM_COLORS[team]
                  : TEAM_COLORS[team] + "44",
            }}
            onClick={() => handleTeamClick(team)}
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
              <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
                <div className="font-bold text-sm text-pink-700 mb-2 flex items-center gap-2">
                  Mujer ({selectedTeamData.women.length})
                </div>
                <div className="flex flex-col gap-1">
                  {selectedTeamData.women.map((p: ParticipantBasic) => (
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
                  {selectedTeamData.men.map((p: ParticipantBasic) => (
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
                        onClick={() => {
                          if (cur && cur !== t) {
                            setConfirmChange({ player: p, fromTeam: cur, toTeam: t });
                          } else {
                            setTeam(p.id, t);
                          }
                        }}
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
