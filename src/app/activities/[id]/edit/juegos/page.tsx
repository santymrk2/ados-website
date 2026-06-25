"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useEditContext } from "../layout";
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { TEAMS, PTS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label, Empty } from "@/components/ui/Common";
import { PodiumBadge } from "@/components/ui/Badges";
import { SavingOverlay } from "@/components/ui/SavingOverlay";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Activity, Juego } from "@/lib/types";

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function computeNewPos(currentPos: Record<string, string[]>, val: string, pos: string): Record<string, string[]> {
  const newPos: Record<string, string[]> = {};
  Object.entries(currentPos || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      newPos[k] = [...v];
    }
  });

  const isToggleOff = Array.isArray(newPos[pos]) && newPos[pos].includes(val);

  Object.keys(newPos).forEach((p) => {
    if (Array.isArray(newPos[p])) {
      newPos[p] = newPos[p].filter((t) => t !== val);
      if (newPos[p].length === 0) delete newPos[p];
    }
  });

  if (!isToggleOff) {
    const posArray = newPos[pos] ? [...newPos[pos]] : [];
    newPos[pos] = [...posArray, val].sort();
  }

  return newPos;
}

export default function JuegosPage() {
  const { activity: act, setLocal, syncWithServer, locked, pendingOps, db } = useEditContext();

  const isAddingSaving =
    pendingOps.size > 0 &&
    Array.from(pendingOps).some((op) => op.startsWith("game_add"));

  const add = async () => {
    const tempId = generateTempId();
    const nj: Juego = { id: tempId, nombre: "", tipo: "grupal", pos: {} };

    // Guardar estado previo para rollback si falla
    const prevJuegos = [...(act.juegos || [])];

    try {
      setLocal("juegos", (prev: Juego[]) => [...(prev || []), nj], true);
      const result = await syncWithServer("game_add", nj);
      if (result && typeof result === "object" && "id" in result) {
        const finalId = (result as { id: number }).id;
        setLocal("juegos", (prev: Juego[]) => (prev || []).map((j) =>
          j.id === tempId ? { ...j, id: finalId } : j,
        ), true);
      } else {
        // Rollback si el servidor no devolvió id
        setLocal("juegos", () => prevJuegos, true);
        toast.error("Error: no se obtuvo el ID del juego");
      }
    } catch (e) {
      // Rollback al estado anterior
      setLocal("juegos", () => prevJuegos, true);
      const err = e as Error;
      toast.error("Error al agregar: " + err.message);
    }
  };

  const del = useCallback(async (id: number | string) => {
    const updateFn = (prev: Juego[]) => (prev || []).filter((j) => j.id !== id);

    const prevJuegos = [...(act.juegos || [])];

    if (typeof id === "string" && id.startsWith("temp")) {
      setLocal("juegos", updateFn, true);
      return;
    }

    setLocal("juegos", updateFn, true);

    try {
      await syncWithServer("game_delete", { id });
      toast.success("Juego eliminado");
    } catch (e) {
      // Rollback al estado anterior
      setLocal("juegos", () => prevJuegos, true);
      const err = e as Error;
      toast.error("Error al eliminar: " + err.message);
    }
  }, [act.juegos, setLocal, syncWithServer]);

  const updN = useCallback(async (id: number | string, v: string) => {
    const prevJuegos = [...(act.juegos || [])];
    const updateFn = (prev: Juego[]) => (prev || []).map((j) => (j.id === id ? { ...j, nombre: v } : j));

    setLocal("juegos", updateFn, true);
    if (typeof id === "string" && id.startsWith("temp")) return;

    try {
      await syncWithServer("game_update", { id, nombre: v });
    } catch (e) {
      setLocal("juegos", () => prevJuegos, true);
      const err = e as Error;
      toast.error("Error al actualizar: " + err.message);
    }
  }, [act.juegos, setLocal, syncWithServer]);

  const updTipo = useCallback(async (jid: number | string, tipo: "grupal" | "individual") => {
    const prevJuegos = [...(act.juegos || [])];
    const updateFn = (prevList: Juego[]) => {
      return (prevList || []).map((game: Juego) => {
        if (game.id !== jid) return game;
        return { ...game, tipo, pos: {} };
      });
    };

    setLocal("juegos", updateFn, true);

    const numericJid = Number(jid);
    if (!isNaN(numericJid) && numericJid > 0) {
      try {
        await syncWithServer("game_update", { id: jid, tipo });
        await syncWithServer("game_pos", { juegoId: jid, pos: {} });
      } catch (e) {
        setLocal("juegos", () => prevJuegos, true);
        const err = e as Error;
        toast.error("Error al actualizar tipo: " + err.message);
      }
    }
  }, [act.juegos, setLocal, syncWithServer]);

  const updPos = useCallback(async (jid: number | string, val: string, pos: string) => {
    const prevJuegos = [...(act.juegos || [])];
    const updateFn = (prevList: Juego[]) => {
      return (prevList || []).map((game: Juego) => {
        if (game.id !== jid) return game;
        const newPos = computeNewPos(game.pos || {}, val, pos);
        return { ...game, pos: newPos };
      });
    };

    setLocal("juegos", updateFn, true);

    const numericJid = Number(jid);
    if (!isNaN(numericJid) && numericJid > 0) {
      try {
        const currentJuego = prevJuegos.find((j: Juego) => j.id === jid);
        if (!currentJuego) return;

        const newPos = computeNewPos(currentJuego.pos || {}, val, pos);
        await syncWithServer("game_pos", { juegoId: jid, pos: newPos });
      } catch (e) {
        setLocal("juegos", () => prevJuegos, true);
        const err = e as Error;
        toast.error("Error al actualizar posición: " + err.message);
      }
    }
  }, [act.juegos, setLocal, syncWithServer]);

  const renderJuegoCard = useCallback((j: Juego, gi: number) => (
    <JuegoCard
      key={String(j.id)}
      j={j}
      gi={gi}
      act={act}
      onNombre={(v: string) => updN(j.id, v)}
      onTipo={(tipo: "grupal" | "individual") => updTipo(j.id, tipo)}
      onDel={() => del(j.id)}
      onPos={(val: string, pos: string) => updPos(j.id, val, pos)}
      locked={locked}
      saving={[...pendingOps].some(
        (op) => op === `game_pos:${j.id}` || op === `game_delete:${j.id}` || op === `game_update:${j.id}`,
      )}
    />
  ), [act, updN, updTipo, del, updPos, locked, pendingOps]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label style={{ margin: 0 }}>Juegos</Label>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked || isAddingSaving}
          className="bg-indigo-50 text-primary font-black px-4"
        >
          <Plus className="w-4 h-4 mr-1" /> Juego
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {(act.juegos || []).map(renderJuegoCard)}
      </div>
      {(act.juegos || []).length === 0 && (
        <Empty text="Sin juegos registrados" />
      )}
    </div>
  );
}

function JuegoCard({
  j,
  gi,
  act,
  onNombre,
  onTipo,
  onDel,
  onPos,
  locked = false,
  saving = false,
}: {
  j: Juego;
  gi: number;
  act: Activity;
  onNombre: (v: string) => void;
  onTipo: (tipo: "grupal" | "individual") => void;
  onDel: () => void;
  onPos: (val: string, pos: string) => void;
  locked?: boolean;
  saving?: boolean;
}) {
  const { db } = useEditContext();
  const [localNombre, setLocalNombre] = useState(j.nombre || "");
  const onNombreRef = useRef(onNombre);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    onNombreRef.current = onNombre;
  }, [onNombre]);

  useEffect(() => {
    queueMicrotask(() => setLocalNombre(j.nombre || ""));
  }, [j.nombre]);

  useEffect(() => {
    if (localNombre === (j.nombre || "")) return;

    const timer = setTimeout(() => {
      onNombreRef.current(localNombre);
    }, 800);

    return () => clearTimeout(timer);
  }, [localNombre, j.id]);

  const attendees = useMemo(() => {
    if (!db?.participants || !act.asistentes) return [];
    return db.participants.filter((p) => act.asistentes.includes(p.id));
  }, [db?.participants, act.asistentes]);

  const isIndividual = j.tipo === "individual";
  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);
  const posToValues = j.pos || {};

  const placed = useMemo(() => {
    const src = j.pos || {};
    const result: string[] = [];
    if (isIndividual) {
      Object.values(src).forEach((pids) => {
        if (Array.isArray(pids)) {
          result.push(...pids);
        }
      });
    } else {
      const teams = TEAMS.slice(0, act.cantEquipos || 4);
      Object.values(src).forEach((equipos) => {
        if (Array.isArray(equipos)) {
          result.push(...(equipos as string[]).filter((team) => teams.includes(team)));
        }
      });
    }
    return result;
  }, [j.pos, isIndividual, act.cantEquipos]);

  const unplacedTeams = activeTeams.filter((t) => !placed.includes(t));
  const unplacedAttendees = useMemo(() => {
    return attendees.filter((p) => !placed.includes(String(p.id)));
  }, [attendees, placed]);

  const filteredUnplacedAttendees = useMemo(() => {
    if (!searchTerm.trim()) return unplacedAttendees;
    const term = searchTerm.toLowerCase();
    return unplacedAttendees.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellido.toLowerCase().includes(term)
    );
  }, [unplacedAttendees, searchTerm]);

  const posArray = useMemo(() => {
    return Array.from({ length: act.cantEquipos || 4 }, (_, i) => String(i + 1));
  }, [act.cantEquipos]);

  const isDisabled = locked || saving;
  const [expanded, setExpanded] = useState(false);

  return (
    <SavingOverlay saving={saving}>
      <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden shadow-sm">
        {/* Header — siempre visible, toggle expand */}
        <div
          className="flex items-center gap-3 p-3 border-b border-surface-dark bg-background cursor-pointer"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center font-black text-primary text-xs shrink-0">
            {gi + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate flex items-center gap-2">
              <span>{localNombre || "Sin nombre"}</span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-surface-dark text-text-muted">
                {isIndividual ? "Individual" : "Grupal"}
              </span>
            </div>
            {!expanded && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {posArray.map((pos) => {
                  const valuesInPos = posToValues[String(pos)] || [];
                  const hasValues = Array.isArray(valuesInPos) && valuesInPos.length > 0;
                  if (!hasValues) return null;
                  return (
                    <div
                      key={pos}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-surface-dark bg-white shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-text-muted w-4 text-center">{pos}°</span>
                      <div className="flex items-center gap-0.5 ml-0.5">
                        {isIndividual ? (
                          valuesInPos.map((pidStr) => {
                            const p = attendees.find((x) => String(x.id) === pidStr);
                            if (!p) return null;
                            return (
                              <span
                                key={pidStr}
                                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[9px] truncate max-w-[80px]"
                              >
                                {p.nombre} {p.apellido.substring(0, 1)}.
                              </span>
                            );
                          })
                        ) : (
                          valuesInPos.filter((team) => activeTeams.includes(team)).map((team) => (
                            <span
                              key={team}
                              className="w-4 h-4 rounded flex items-center justify-center font-black text-white text-[8px]"
                              style={{ backgroundColor: TEAM_COLORS[team] }}
                            >
                              {team}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              const ok = await confirmDialog(
                `¿Eliminar "${localNombre || "este juego"}"?`,
                { title: "Eliminar juego", confirmText: "Eliminar", isDestructive: true }
              );
              if (ok) onDel();
            }}
            variant="ghost"
            size="icon"
            disabled={isDisabled}
            className="h-9 w-9 text-text-muted hover:bg-red-50 hover:text-red-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cuerpo expandido — solo visible cuando expanded */}
        {expanded && (
          <>
            <div className="p-3 border-b border-surface-dark bg-background flex flex-col sm:flex-row gap-2.5">
              <Input
                value={localNombre}
                onChange={(e) => setLocalNombre(e.target.value)}
                placeholder="Nombre del juego..."
                className="bg-white h-9 flex-1"
                disabled={isDisabled}
              />
              <div className="flex gap-1 border border-surface-dark rounded-lg p-0.5 bg-white self-start shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (!isIndividual) return;
                    const ok = await confirmDialog("¿Cambiar tipo a Grupal? Se borrarán las posiciones actuales.", { title: "Cambiar tipo de juego", confirmText: "Cambiar", isDestructive: true });
                    if (ok) {
                      onTipo("grupal");
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-colors",
                    !isIndividual
                      ? "bg-primary text-white"
                      : "text-text-muted hover:bg-surface-light"
                  )}
                >
                  Grupal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isIndividual) return;
                    const ok = await confirmDialog("¿Cambiar tipo a Individual? Se borrarán las posiciones actuales.", { title: "Cambiar tipo de juego", confirmText: "Cambiar", isDestructive: true });
                    if (ok) {
                      onTipo("individual");
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-colors",
                    isIndividual
                      ? "bg-primary text-white"
                      : "text-text-muted hover:bg-surface-light"
                  )}
                >
                  Individual
                </button>
              </div>
            </div>
            <div className="p-3 bg-surface-light/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {posArray.map((pos) => {
                  const valuesInPos = posToValues[String(pos)] || [];
                  const hasValues = Array.isArray(valuesInPos) && valuesInPos.length > 0;
                  const canAdd = isIndividual ? unplacedAttendees.length > 0 : unplacedTeams.length > 0;

                  return (
                    <div
                      key={pos}
                      className={cn(
                        "flex flex-col p-2.5 rounded-xl transition-all border",
                        hasValues
                          ? "bg-white border-surface-dark shadow-sm"
                          : "bg-transparent border-dashed border-surface-dark/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <PodiumBadge pos={Number(pos) as number} />
                          <span className="text-[10px] text-text-muted font-bold tracking-wider">
                            +{(PTS.rec as Record<string, number>)[pos] ?? 0} PTS
                          </span>
                        </div>

                        {canAdd && !isDisabled && (
                          <Popover onOpenChange={(open) => { if (open) setSearchTerm(""); }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] font-black uppercase tracking-tight text-primary hover:bg-primary/5"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Agregar
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-48 p-1 shadow-xl">
                              {isIndividual ? (
                                <>
                                  <div className="text-[9px] font-black text-text-muted uppercase px-2 py-1.5 border-b border-surface-dark mb-1">
                                    Seleccionar Participante
                                  </div>
                                  <div className="px-2 py-1">
                                    <Input
                                      placeholder="Buscar..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="h-7 text-xs bg-white"
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-0.5 mt-1">
                                    {filteredUnplacedAttendees.map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => onPos(String(p.id), String(pos))}
                                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-light transition-colors text-left"
                                      >
                                        <span className="text-xs font-bold text-text truncate">
                                          {p.nombre} {p.apellido}
                                        </span>
                                      </button>
                                    ))}
                                    {filteredUnplacedAttendees.length === 0 && (
                                      <div className="text-[10px] text-text-muted py-2 text-center">
                                        No hay resultados
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-[9px] font-black text-text-muted uppercase px-2 py-1.5 border-b border-surface-dark mb-1">
                                    Seleccionar Equipo
                                  </div>
                                  <div className="grid grid-cols-1 gap-0.5">
                                    {unplacedTeams.map((t) => (
                                      <button
                                        key={t}
                                        onClick={() => onPos(t, String(pos))}
                                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-light transition-colors text-left"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-5 h-5 rounded flex items-center justify-center font-black text-white text-[10px]"
                                            style={{ backgroundColor: TEAM_COLORS[t] }}
                                          >
                                            {t}
                                          </div>
                                          <span className="text-xs font-bold" style={{ color: TEAM_COLORS[t] }}>Equipo {t}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap min-h-[32px]">
                        {hasValues ? (
                          isIndividual ? (
                            valuesInPos.map((pidStr) => {
                              const p = attendees.find((x) => String(x.id) === pidStr);
                              if (!p) return null;
                              return (
                                <div
                                  key={pidStr}
                                  className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg border border-surface-dark bg-white shadow-sm group animate-in zoom-in-95 duration-200"
                                >
                                  <span className="font-bold text-xs text-text">
                                    {p.nombre} {p.apellido}
                                  </span>
                                  <button
                                    onClick={() => !isDisabled && onPos(pidStr, String(pos))}
                                    disabled={isDisabled}
                                    className="p-1 rounded-md hover:bg-black/5 transition-colors text-text-muted hover:text-text"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            valuesInPos.filter((team) => activeTeams.includes(team)).map((team) => (
                              <div
                                key={team}
                                className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg border shadow-sm group animate-in zoom-in-95 duration-200"
                                style={{
                                  backgroundColor: getTeamBg(team),
                                  borderColor: TEAM_COLORS[team],
                                }}
                              >
                                <span className="font-black text-xs" style={{ color: TEAM_COLORS[team] }}>
                                  {team}
                                </span>
                                <button
                                  onClick={() => !isDisabled && onPos(team, String(pos))}
                                  disabled={isDisabled}
                                  className="p-1 rounded-md hover:bg-black/10 transition-colors text-current/60 hover:text-current"
                                  style={{ color: TEAM_COLORS[team] }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )
                        ) : (
                          <div className="flex-1 flex items-center justify-center py-2 opacity-30">
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-text-muted">Sin asignar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </SavingOverlay>
  );
}
