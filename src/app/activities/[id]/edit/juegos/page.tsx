"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditContext } from "../layout";
import { Gamepad2, Plus, Users, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { TEAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Empty } from "@/components/ui/Common";
import type { Juego, ParticipantBasic } from "@/lib/types";

const POSITIONS = ["1", "2", "3", "4"] as const;

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type JuegoTipo = "grupal" | "individual";

type ParticipantOption = ParticipantBasic & { team: string };

function normalizePos(currentPos: Record<string, string[]>) {
  const next: Record<string, string[]> = {};
  Object.entries(currentPos || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) next[key] = [...value];
  });
  return next;
}

function computeNewPos(currentPos: Record<string, string[]>, itemId: string, pos: string) {
  const next = normalizePos(currentPos);
  Object.keys(next).forEach((key) => {
    if (Array.isArray(next[key])) {
      next[key] = next[key].filter((value) => value !== itemId);
    }
  });

  const current = next[pos] ? [...next[pos]] : [];
  if (current.includes(itemId)) {
    next[pos] = current.filter((value) => value !== itemId);
    return next;
  }

  next[pos] = [...current, itemId].sort();
  return next;
}

function fillRemainingPos(
  currentPos: Record<string, string[]>,
  pos: string,
  values: string[],
) {
  const next = normalizePos(currentPos);
  const assigned = new Set(Object.values(next).flat());
  const target = next[pos] ? [...next[pos]] : [];

  for (const value of values) {
    if (!assigned.has(value) && !target.includes(value)) {
      target.push(value);
    }
  }

  next[pos] = target.sort();
  return next;
}

function gameTypeLabel(tipo: JuegoTipo) {
  return tipo === "individual" ? "Individual" : "Grupal";
}

export default function JuegosPage() {
  const { activity: act, setLocal, syncWithServer, locked, pendingOps, db } = useEditContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const selectedIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const participants = db.participants;
  const activeTeams = useMemo(() => TEAMS.slice(0, act.cantEquipos || 4), [act.cantEquipos]);
  const gameList = useMemo(() => act.juegos || [], [act.juegos]);

  const eligiblePlayers = useMemo(() => {
    return participants
      .filter((p) => act.asistentes.includes(p.id) && act.equipos?.[String(p.id)])
      .map((p) => ({ ...p, team: act.equipos?.[String(p.id)] || "" }))
      .filter((p) => activeTeams.includes(p.team))
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));
  }, [participants, act.asistentes, act.equipos, activeTeams]);

  const isAddingSaving =
    pendingOps.size > 0 && Array.from(pendingOps).some((op) => op.startsWith("game_add"));

  const selectedGame = useMemo(
    () => gameList.find((game) => game.id === selectedId) || null,
    [gameList, selectedId],
  );

  const commitGamePositions = useCallback(
    async (gameId: number | string, nextPos: Record<string, string[]>) => {
      const prevJuegos = [...(act.juegos || [])];
      const updateFn = (prev: Juego[]) =>
        (prev || []).map((game) => (game.id === gameId ? { ...game, pos: nextPos } : game));

      setLocal("juegos", updateFn, true);
      if (typeof gameId === "string" && gameId.startsWith("temp")) return;

      try {
        await syncWithServer("game_pos", { juegoId: gameId, pos: nextPos });
      } catch (error) {
        setLocal("juegos", () => prevJuegos, true);
        const err = error as Error;
        toast.error("Error al actualizar posición: " + err.message);
      }
    },
    [act.juegos, setLocal, syncWithServer],
  );

  const addGame = useCallback(
    async (tipo: JuegoTipo) => {
      if (locked || isAddingSaving) return;

      const tempId = generateTempId();
      const prevJuegos = [...(act.juegos || [])];
      const game: Juego = { id: tempId, nombre: "", tipo, pos: {} };

      setLocal("juegos", (prev: Juego[]) => [...(prev || []), game], true);
      setCreateOpen(false);

      try {
        const result = await syncWithServer("game_add", game);
        if (result && typeof result === "object" && "id" in result) {
          const finalId = (result as { id: number }).id;
          setLocal(
            "juegos",
            (prev: Juego[]) => (prev || []).map((j) => (j.id === tempId ? { ...j, id: finalId } : j)),
            true,
          );
          setSelectedId(finalId);
        } else {
          setSelectedId(tempId);
        }
      } catch (error) {
        setLocal("juegos", () => prevJuegos, true);
        const err = error as Error;
        toast.error("Error al agregar: " + err.message);
      }
    },
    [act.juegos, isAddingSaving, locked, setLocal, syncWithServer],
  );

  const deleteGame = useCallback(
    async (gameId: number | string) => {
      const prevJuegos = [...(act.juegos || [])];
      const updateFn = (prev: Juego[]) => (prev || []).filter((game) => game.id !== gameId);

      if (typeof gameId === "string" && gameId.startsWith("temp")) {
        setLocal("juegos", updateFn, true);
        if (selectedIdRef.current === gameId) setSelectedId(null);
        return;
      }

      setLocal("juegos", updateFn, true);
      if (selectedIdRef.current === gameId) setSelectedId(null);

      try {
        await syncWithServer("game_delete", { id: gameId });
      } catch (error) {
        setLocal("juegos", () => prevJuegos, true);
        const err = error as Error;
        toast.error("Error al eliminar: " + err.message);
      }
    },
    [act.juegos, setLocal, syncWithServer],
  );

  const updateName = useCallback(
    async (gameId: number | string, nombre: string) => {
      const prevJuegos = [...(act.juegos || [])];
      const updateFn = (prev: Juego[]) =>
        (prev || []).map((game) => (game.id === gameId ? { ...game, nombre } : game));

      setLocal("juegos", updateFn, true);
      if (typeof gameId === "string" && gameId.startsWith("temp")) return;

      try {
        await syncWithServer("game_update", { id: gameId, nombre });
      } catch (error) {
        setLocal("juegos", () => prevJuegos, true);
        const err = error as Error;
        toast.error("Error al actualizar: " + err.message);
      }
    },
    [act.juegos, setLocal, syncWithServer],
  );

  const togglePositionItem = useCallback(
    (gameId: number | string, itemId: string, pos: string) => {
      const game = gameList.find((item) => item.id === gameId);
      if (!game) return;
      void commitGamePositions(gameId, computeNewPos(game.pos || {}, itemId, pos));
    },
    [commitGamePositions, gameList],
  );

  const fillWithRemaining = useCallback(
    (gameId: number | string, pos: string) => {
      const game = gameList.find((item) => item.id === gameId);
      if (!game) return;
      const allIds = eligiblePlayers.map((player) => String(player.id));
      void commitGamePositions(gameId, fillRemainingPos(game.pos || {}, pos, allIds));
    },
    [commitGamePositions, eligiblePlayers, gameList],
  );

  const renderSummary = useCallback(
    (game: Juego) => {
      const groups = Object.entries(game.pos || {}).filter(([pos]) => pos !== "0");
      const total = groups.reduce((acc, [, values]) => acc + values.length, 0);
      return `${gameTypeLabel(game.tipo || "grupal")} · ${groups.length} posiciones · ${total} asignados`;
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Label style={{ margin: 0 }}>Juegos</Label>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="ghost"
          size="sm"
          disabled={locked || isAddingSaving}
          className="bg-indigo-50 text-primary font-black px-4"
        >
          <Plus className="w-4 h-4 mr-1" /> Juego
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {gameList.map((game, index) => (
          <button
            key={String(game.id)}
            type="button"
            onClick={() => setSelectedId(game.id)}
            className="text-left rounded-2xl border border-surface-dark bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm truncate">
                    {game.nombre || `Juego ${index + 1}`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {game.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
                    {gameTypeLabel(game.tipo || "grupal")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{renderSummary(game)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 hover:bg-red-50 hover:text-red-500"
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await confirmDialog(
                    `Vas a eliminar ${game.nombre || "este juego"}.`,
                    { title: "Eliminar juego", confirmText: "Eliminar", isDestructive: true },
                  );
                  if (ok) await deleteGame(game.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </button>
        ))}
      </div>

      {gameList.length === 0 && <Empty text="Sin juegos registrados" />}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar juego</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void addGame("grupal")}
              className="rounded-2xl border border-surface-dark bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Gamepad2 className="h-4 w-4" />
                Juego grupal
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Mantiene el flujo actual: equipos en posiciones y puntaje por equipo.
              </p>
            </button>
            <button
              type="button"
              onClick={() => void addGame("individual")}
              className="rounded-2xl border border-surface-dark bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Users className="h-4 w-4" />
                Juego individual
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Asigna personas a posiciones y suma puntos por participante.
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {selectedGame && (
            <GameDetailModal
              game={selectedGame}
              activeTeams={activeTeams}
              players={eligiblePlayers}
              locked={locked}
              onRename={(nombre) => void updateName(selectedGame.id, nombre)}
              onDelete={async () => {
                const ok = await confirmDialog(
                  `Vas a eliminar ${selectedGame.nombre || "este juego"}.`,
                  { title: "Eliminar juego", confirmText: "Eliminar", isDestructive: true },
                );
                if (ok) await deleteGame(selectedGame.id);
              }}
              onToggleItem={togglePositionItem}
              onFillRemaining={fillWithRemaining}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GameDetailModal({
  game,
  activeTeams,
  players,
  locked,
  onRename,
  onDelete,
  onToggleItem,
  onFillRemaining,
}: {
  game: Juego;
  activeTeams: string[];
  players: ParticipantOption[];
  locked: boolean;
  onRename: (value: string) => void;
  onDelete: () => Promise<void>;
  onToggleItem: (gameId: number | string, itemId: string, pos: string) => void;
  onFillRemaining: (gameId: number | string, pos: string) => void;
}) {
  const items = game.tipo === "individual" ? players : activeTeams;
  const toLabel = (id: string) => {
    if (game.tipo === "individual") {
      const person = players.find((p) => String(p.id) === id);
      return person ? `${person.nombre} ${person.apellido}` : id;
    }
    return id;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <DialogHeader>
            <DialogTitle>Detalle del juego</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {game.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
              {gameTypeLabel(game.tipo || "grupal")}
            </span>
            <span className="text-xs text-muted-foreground">
              {game.tipo === "individual" ? "Selecciona personas de equipos" : "Selecciona equipos"}
            </span>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input
          value={game.nombre || ""}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Nombre del juego..."
          disabled={locked}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {POSITIONS.map((pos) => {
          const selected = (game.pos || {})[pos] || [];
          return (
            <div key={pos} className="rounded-2xl border border-surface-dark bg-surface-light/20 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                    {pos}
                  </span>
                  <span className="font-bold">Puesto {pos}</span>
                </div>
                {game.tipo === "individual" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onFillRemaining(game.id, pos)} disabled={locked}>
                    Completar resto
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const id = game.tipo === "individual" ? String(item.id) : item;
                  const label = toLabel(id);
                  const active = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={locked}
                      onClick={() => onToggleItem(game.id, id, pos)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-surface-dark bg-white hover:border-primary hover:text-primary"
                      }`}
                    >
                      {label}
                      {game.tipo === "individual" && item && typeof item === "object" && "team" in item ? ` · ${item.team}` : ""}
                    </button>
                  );
                })}
              </div>

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                  {selected.map((value) => (
                    <span key={value} className="rounded-full bg-white px-2 py-1 border border-surface-dark/50">
                      {toLabel(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
