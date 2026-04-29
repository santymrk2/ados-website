"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useEditContext } from "../layout";
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

function computeNewPos(currentPos: Record<string, string[]>, team: string, pos: string): Record<string, string[]> {
  const newPos: Record<string, string[]> = {};
  Object.entries(currentPos || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      newPos[k] = [...v];
    }
  });

  const isToggleOff = Array.isArray(newPos[pos]) && newPos[pos].includes(team);

  Object.keys(newPos).forEach((p) => {
    if (Array.isArray(newPos[p])) {
      newPos[p] = newPos[p].filter((t) => t !== team);
      if (newPos[p].length === 0) delete newPos[p];
    }
  });

  if (!isToggleOff) {
    const posArray = newPos[pos] ? [...newPos[pos]] : [];
    newPos[pos] = [...posArray, team].sort();
  }

  return newPos;
}

export default function JuegosPage() {
  const { activity: act, setLocal, syncWithServer, locked, pendingOps } = useEditContext();

  const isAddingSaving =
    pendingOps.size > 0 &&
    Array.from(pendingOps).some((op) => op.startsWith("game_add"));

  const add = async () => {
    const tempId = generateTempId();
    const nj: Juego = { id: tempId, nombre: "", pos: {} };

    // Guardar estado previo para rollback si falla
    const prevJuegos = [...(act.juegos || [])];

    try {
      const result = await syncWithServer("game_add", nj, "juegos", (prev) => [...(prev || []), nj]);
      if (result && typeof result === "object" && "id" in result) {
        const finalId = (result as { id: number }).id;
        setLocal("juegos", (prev: Juego[]) => (prev || []).map((j) =>
          j.id === tempId ? { ...j, id: finalId } : j,
        ), true);
        toast.success("Juego agregado");
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
      await syncWithServer("game_delete", { id }, "juegos", updateFn);
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
      await syncWithServer("game_update", { id, nombre: v }, "juegos", updateFn);
    } catch (e) {
      setLocal("juegos", () => prevJuegos, true);
      const err = e as Error;
      toast.error("Error al actualizar: " + err.message);
    }
  }, [act.juegos, setLocal, syncWithServer]);

  const updPos = useCallback(async (jid: number | string, team: string, pos: string) => {
    const prevJuegos = [...(act.juegos || [])];
    const updateFn = (prevList: Juego[]) => {
      return (prevList || []).map((game: Juego) => {
        if (game.id !== jid) return game;
        const newPos = computeNewPos(game.pos || {}, team, pos);
        return { ...game, pos: newPos };
      });
    };

    setLocal("juegos", updateFn, true);

    if (typeof jid === "number" && jid > 0) {
      try {
        const currentJuego = prevJuegos.find((j: Juego) => j.id === jid);
        if (!currentJuego) return;

        const newPos = computeNewPos(currentJuego.pos || {}, team, pos);
        await syncWithServer("game_pos", { juegoId: jid, pos: newPos }, "juegos", updateFn);
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
      onDel={() => del(j.id)}
      onPos={(team: string, pos: string) => updPos(j.id, team, pos)}
      locked={locked}
      saving={[...pendingOps].some(
        (op) => op === `game_pos:${j.id}` || op === `game_delete:${j.id}`,
      )}
    />
  ), [act, updN, del, updPos, locked, pendingOps]);

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
  onDel,
  onPos,
  locked = false,
  saving = false,
}: {
  j: Juego;
  gi: number;
  act: Activity;
  onNombre: (v: string) => void;
  onDel: () => void;
  onPos: (team: string, pos: string) => void;
  locked?: boolean;
  saving?: boolean;
}) {
  const [localNombre, setLocalNombre] = useState(j.nombre || "");
  const onNombreRef = useRef(onNombre);
  onNombreRef.current = onNombre;

  useEffect(() => {
    setLocalNombre(j.nombre || "");
  }, [j.nombre]);

  useEffect(() => {
    if (localNombre === (j.nombre || "")) return;

    const timer = setTimeout(() => {
      onNombreRef.current(localNombre);
    }, 800);

    return () => clearTimeout(timer);
  }, [localNombre, j.id]);

  const posToTeams = j.pos || {};
  const placed: string[] = [];
  Object.values(posToTeams).forEach((equipos) => {
    if (Array.isArray(equipos)) {
      placed.push(...(equipos as string[]));
    }
  });

  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);
  const unplaced = activeTeams.filter((t) => !placed.includes(t));
  const posArray = useMemo(() => {
    const arr: string[] = ["1", "2", "3", "4"];
    if (act.cantEquipos === 6) arr.push("5", "6");
    return arr;
  }, [act.cantEquipos]);

  const isDisabled = locked || saving;

  return (
    <SavingOverlay saving={saving}>
      <div className="bg-white rounded-2xl border border-surface-dark overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-3 border-b border-surface-dark bg-background">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center font-black text-primary text-xs">
            {gi + 1}
          </div>
          <Input
            value={localNombre}
            onChange={(e) => setLocalNombre(e.target.value)}
            placeholder="Nombre del juego..."
            className="flex-1 bg-white h-9"
            disabled={isDisabled}
          />
          <Button
            onClick={onDel}
            variant="ghost"
            size="icon"
            disabled={isDisabled}
            className="h-9 w-9 text-text-muted hover:bg-red-50 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-3 bg-surface-light/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {posArray.map((pos) => {
              const teamsInPos = (posToTeams[String(pos)]) || [];
              const hasTeams = Array.isArray(teamsInPos) && teamsInPos.length > 0;

              return (
                <div
                  key={pos}
                  className={cn(
                    "flex flex-col p-2.5 rounded-xl transition-all border",
                    hasTeams
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

                    {unplaced.length > 0 && !isDisabled && (
                      <Popover>
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
                          <div className="text-[9px] font-black text-text-muted uppercase px-2 py-1.5 border-b border-surface-dark mb-1">
                            Seleccionar Equipo
                          </div>
                          <div className="grid grid-cols-1 gap-0.5">
                            {unplaced.map((t) => (
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
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap min-h-[32px]">
                    {hasTeams ? (
                      teamsInPos.map((team) => (
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
      </div>
    </SavingOverlay>
  );
}