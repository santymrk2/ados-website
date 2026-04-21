"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { TEAMS, PTS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label, Empty } from "@/components/ui/Common";
import { PodiumBadge } from "@/components/ui/Badges";
import { SavingOverlay } from "@/components/ui/SavingOverlay";

let tempIdCounter = 0;
const generateTempId = () => -1 - tempIdCounter++;

export function TabJuegos({ act, A, Q, locked = false, savingOps = new Set() }: { act: any; A: any; Q: any; locked?: boolean; savingOps?: Set<unknown> }) {
  const isAddingSaving = savingOps.size > 0 && Array.from(savingOps as Set<string>).some(op => op.startsWith('game_add'));
  // Validar que no haya equipos duplicateados en el mismo juego
  const noDuplicateTeams = useMemo(() => {
    for (const j of act.juegos || []) {
      const placed: any[] = [];
      Object.values(j.pos || {}).forEach((equipos) => {
        if (Array.isArray(equipos)) {
          placed.push(...equipos);
        }
      });
      // Check for duplicates in the same game
      const seen = new Set();
      for (const t of placed) {
        if (seen.has(t)) {
          return false;
        }
        seen.add(t);
      }
    }
    return true;
  }, [act.juegos]);

  // Validar que todos los juegos tengan al menos 2 equipos asignados
  // REMOVED: Esta validación的限制 estaba causando problemas
  const validateGames = () => {
    // Ya no restringimos la creación de nuevos juegos por falta de posiciones
    return true;
  };

  const add = async () => {
    const tempId = generateTempId();
    const nj = { id: tempId, nombre: "", pos: {} };
    const result = await Q("game_add", nj, "juegos", [
      ...(act.juegos || []),
      nj,
    ]);
    // Replace the temp ID with the real DB-generated ID
    if (result?.id) {
      A("juegos", [...(act.juegos || []), { ...nj, id: result.id }]);
    }
  };
  const del = (id) =>
    Q(
      "game_delete",
      { id },
      "juegos",
      (act.juegos || []).filter((j) => j.id !== id),
    );
  const updN = (id, v) =>
    A(
      "juegos",
      (act.juegos || []).map((j) => (j.id === id ? { ...j, nombre: v } : j)),
    );
  const updPos = (jid, team, pos) => {
    const game = (act.juegos || []).find((j) => j.id === jid);
    if (!game) return;

    // Deep clone para evitar mutar el state anterior
    const newPos = {};
    Object.entries(game.pos || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        newPos[k] = [...v];
      }
    });

    // Verificar si el equipo ya está en esta posición (toggle off)
    const isToggleOff = Array.isArray(newPos[pos]) && newPos[pos].includes(team);

    // Primero: remover el equipo de TODAS las posiciones
    Object.keys(newPos).forEach((p) => {
      if (Array.isArray(newPos[p])) {
        newPos[p] = newPos[p].filter((t) => t !== team);
        if (newPos[p].length === 0) {
          delete newPos[p];
        }
      }
    });

    // Segundo: si no es toggle off, agregar a la nueva posición
    if (!isToggleOff) {
      const posArray = newPos[pos] ? [...newPos[pos]] : [];
      newPos[pos] = [...posArray, team].sort();
    }

    const newList = (act.juegos || []).map((g) =>
      g.id === jid ? { ...g, pos: newPos } : g,
    );
    Q("game_pos", { juegoId: jid, pos: newPos }, "juegos", newList);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label style={{ margin: 0 }}>Juegos</Label>
        <Button
          onClick={add}
          variant="ghost"
          size="sm"
          disabled={locked || !validateGames() || isAddingSaving}
          className="bg-indigo-50 text-primary"
          title={
            !validateGames()
              ? "Completa los juegos actuales antes de agregar uno nuevo"
              : ""
          }
        >
          + Juego
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {(act.juegos || []).map((j, gi) => (
          <JuegoCard
            key={j.id}
            j={j}
            gi={gi}
            act={act}
            onNombre={(v) => updN(j.id, v)}
            onDel={() => del(j.id)}
            onPos={(team, pos) => updPos(j.id, team, pos)}
            locked={locked}
            saving={
              [...savingOps].some(op => 
                op === `game_pos:${j.id}` || 
                op === `game_delete:${j.id}`
              )
            }
          />
        ))}
      </div>
      {(act.juegos || []).length === 0 && (
        <Empty text="Sin juegos registrados" />
      )}
    </div>
  );
}

function JuegoCard({ j, gi, act, onNombre, onDel, onPos, locked = false, saving = false }) {
  // Nueva estructura: j.pos = { 1: ["E1", "E2"], 2: ["E3"], 3: ["E4"] }
  const posToTeams = j.pos || {}; // Ahora ya es { posicion: [equipos] }

  // Obtener todos los equipos ya asignados (en cualquier posición)
  const placed: any[] = [];
  Object.values(posToTeams).forEach((equipos) => {
    if (Array.isArray(equipos)) {
      placed.push(...equipos);
    }
  });

  const activeTeams = TEAMS.slice(0, act.cantEquipos || 4);
  const unplaced = activeTeams.filter((t) => !placed.includes(t));
  const posArray = useMemo(() => {
    const arr = [1, 2, 3, 4];
    if (act.cantEquipos === 6) arr.push(5, 6);
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
          value={j.nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Nombre del juego..."
          className="flex-1 bg-white"
          disabled={isDisabled}
        />
        <Button
          onClick={onDel}
          variant="destructive"
          size="icon"
          disabled={isDisabled}
        >
          ✕
        </Button>
      </div>
      <div className="p-3">
        <div className="flex flex-col gap-2 mb-3">
          {posArray.map((pos) => {
            const teamsInPos = posToTeams[pos] || [];
            return (
              <div
                key={pos}
                className="flex flex-col p-2 rounded-xl min-h-12 bg-surface-dark/10 border border-surface-dark/30"
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <PodiumBadge pos={pos} />
                  <span className="text-[10px] text-text-muted font-bold tracking-wider">
                    +{PTS.rec[pos] || 0} PTS
                  </span>
                </div>
                {Array.isArray(teamsInPos) && teamsInPos.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {teamsInPos.map((team) => (
                      <div
                        key={team}
                        onClick={() => !isDisabled && onPos(team, pos)}
                        className={cn(
                          "flex items-center justify-between px-3 py-1.5 rounded-lg flex-1 min-w-[100px]",
                          !isDisabled && "cursor-pointer",
                        )}
                        style={{
                          backgroundColor: getTeamBg(team),
                          border: `2px solid ${TEAM_COLORS[team]}`,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        <span
                          className="font-black text-sm"
                          style={{ color: TEAM_COLORS[team] }}
                        >
                          {team}
                        </span>
                        {!isDisabled && (
                          <span
                            className="text-[9px] opacity-70 uppercase font-black"
                            style={{ color: TEAM_COLORS[team] }}
                          >
                            quitar
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-text-muted text-xs px-1 opacity-60">
                    — Vacío
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {unplaced.length > 0 && (
          <div className="bg-background rounded-xl p-3 border border-surface-dark">
            <div className="text-[10px] text-text-muted font-bold mb-3 uppercase tracking-wide text-center">
              Asignar equipos sin posición
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {unplaced.map((t) => (
                <div
                  key={t}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 shadow-sm"
                  style={{
                    borderColor: TEAM_COLORS[t],
                    backgroundColor: getTeamBg(t),
                  }}
                >
                  <span
                    className="font-black text-sm"
                    style={{ color: TEAM_COLORS[t] }}
                  >
                    {t}
                  </span>
                  <div className="flex flex-wrap justify-center gap-1 bg-white/60 rounded-lg p-1 w-full min-w-[120px]">
                    {posArray.map((p) => (
                      <Button
                        key={p}
                        onClick={() => onPos(t, p)}
                        variant="outline"
                        size="sm"
                        disabled={isDisabled}
                        className="flex-1 min-w-6 h-7 rounded-md font-bold text-[11px]"
                      >
                        {p}°
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {unplaced.length === 0 && (
          <div className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-100 text-center">
            ✓ Todos posicionados
          </div>
        )}
      </div>
      </div>
    </SavingOverlay>
  );
}
