"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditContext } from "../layout";
import { Gamepad2, Plus, Users, X, Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { TEAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Empty } from "@/components/ui/Common";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/Avatar";
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
  const wasInTarget = (next[pos] || []).includes(itemId);

  Object.keys(next).forEach((key) => {
    if (Array.isArray(next[key])) {
      next[key] = next[key].filter((value) => value !== itemId);
      if (next[key].length === 0) delete next[key];
    }
  });

  if (wasInTarget) return next;

  next[pos] = [...(next[pos] || []), itemId].sort();
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
  const { activity: act, setLocal, syncWithServer, locked, db } = useEditContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const selectedIdRef = useRef<number | string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

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

  const selectedGame = useMemo(
    () => gameList.find((game) => game.id === selectedId) || null,
    [gameList, selectedId],
  );

  const commitGamePositions = useCallback(
    async (gameId: number | string, nextPos: Record<string, string[]>) => {
      if (savingRef.current || (typeof gameId === "string" && gameId.startsWith("temp"))) return;

      const updateFn = (prev: Juego[]) =>
        (prev || []).map((game) => (game.id === gameId ? { ...game, pos: nextPos } : game));

      savingRef.current = true;
      setSaving(true);

      try {
        await syncWithServer("game_pos", { juegoId: gameId, pos: nextPos });
        setLocal("juegos", updateFn, true);
      } catch (error) {
        const err = error as Error;
        toast.error("Error al actualizar posición: " + err.message);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [setLocal, syncWithServer],
  );

  const addGame = useCallback(
    async (tipo: JuegoTipo) => {
      if (locked || savingRef.current) return;

      savingRef.current = true;
      setSaving(true);

      try {
        const result = await syncWithServer("game_add", { nombre: "", tipo, pos: {} });
        setCreateOpen(false);
        if (result && typeof result === "object" && "id" in result) {
          const finalId = (result as { id: number }).id;
          const game: Juego = { id: finalId, nombre: "", tipo, pos: {} };
          setLocal("juegos", (prev: Juego[]) => [...(prev || []), game], true);
          setSelectedId(finalId);
        }
      } catch (error) {
        const err = error as Error;
        toast.error("Error al agregar: " + err.message);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [locked, setLocal, syncWithServer],
  );

  const deleteGame = useCallback(
    async (gameId: number | string) => {
      if (typeof gameId === "string" && gameId.startsWith("temp")) {
        setLocal("juegos", (prev: Juego[]) => (prev || []).filter((game) => game.id !== gameId), true);
        if (selectedIdRef.current === gameId) setSelectedId(null);
        return;
      }

      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);

      try {
        await syncWithServer("game_delete", { id: gameId });
        setLocal("juegos", (prev: Juego[]) => (prev || []).filter((game) => game.id !== gameId), true);
        if (selectedIdRef.current === gameId) setSelectedId(null);
      } catch (error) {
        const err = error as Error;
        toast.error("Error al eliminar: " + err.message);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [setLocal, syncWithServer],
  );

  const updateName = useCallback(
    async (gameId: number | string, nombre: string) => {
      if (typeof gameId === "string" && gameId.startsWith("temp")) return;
      if (savingRef.current) return;

      const updateFn = (prev: Juego[]) =>
        (prev || []).map((game) => (game.id === gameId ? { ...game, nombre } : game));

      savingRef.current = true;
      setSaving(true);

      try {
        await syncWithServer("game_update", { id: gameId, nombre });
        setLocal("juegos", updateFn, true);
      } catch (error) {
        const err = error as Error;
        toast.error("Error al actualizar: " + err.message);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [setLocal, syncWithServer],
  );

  const togglePositionItem = useCallback(
    (gameId: number | string, itemId: string, pos: string) => {
      const game = act.juegos?.find((item) => item.id === gameId);
      if (!game) return;
      void commitGamePositions(gameId, computeNewPos(game.pos || {}, itemId, pos));
    },
    [act.juegos, commitGamePositions],
  );

  const fillWithRemaining = useCallback(
    (gameId: number | string, pos: string) => {
      const game = act.juegos?.find((item) => item.id === gameId);
      if (!game || savingRef.current) return;
      const allIds = eligiblePlayers.map((player) => String(player.id));
      void commitGamePositions(gameId, fillRemainingPos(game.pos || {}, pos, allIds));
    },
    [act.juegos, commitGamePositions, eligiblePlayers],
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
          disabled={locked || saving}
          className="bg-indigo-50 text-primary font-black px-4"
        >
          <Plus className="w-4 h-4 mr-1" /> Juego
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {gameList.map((game, index) => (
          <div
            key={String(game.id)}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(game.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(game.id); }}
            className="text-left rounded-2xl border border-surface-dark bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
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
          </div>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl" showCloseButton={false}>
          {selectedGame && (
            <GameDetailModal
              game={selectedGame}
              activeTeams={activeTeams}
              players={eligiblePlayers}
              locked={locked}
              saving={saving}
              onClose={() => setSelectedId(null)}
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
  saving,
  onClose,
  onRename,
  onDelete,
  onToggleItem,
  onFillRemaining,
}: {
  game: Juego;
  activeTeams: string[];
  players: ParticipantOption[];
  locked: boolean;
  saving: boolean;
  onClose: () => void;
  onRename: (value: string) => void;
  onDelete: () => Promise<void>;
  onToggleItem: (gameId: number | string, itemId: string, pos: string) => void;
  onFillRemaining: (gameId: number | string, pos: string) => void;
}) {
  const [localName, setLocalName] = useState(game.nombre || "");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const assignedIds = useMemo(() => {
    if (game.tipo !== "individual") return new Set<string>();
    return new Set(Object.values(game.pos || {}).flat());
  }, [game.pos, game.tipo]);

  const availablePlayers = useMemo(() => {
    if (game.tipo !== "individual") return [];
    return players.filter((p) => !assignedIds.has(String(p.id)));
  }, [players, assignedIds, game.tipo]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return availablePlayers;
    const q = search.toLowerCase();
    return availablePlayers.filter((p) =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(q),
    );
  }, [availablePlayers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Button type="button" variant="ghost" size="icon-sm" disabled={saving} onClick={onDelete} className="shrink-0 hover:bg-red-50 hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1 space-y-2 text-center">
          <DialogHeader>
            <DialogTitle>Detalle del juego</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {game.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
              {gameTypeLabel(game.tipo || "grupal")}
            </span>
            <span className="text-xs text-muted-foreground">
              {game.tipo === "individual" ? "Selecciona personas de equipos" : "Selecciona equipos"}
            </span>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 bg-secondary">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => onRename(localName)}
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
                {game.tipo === "individual" ? (
                  <div className="flex items-center gap-1">
                    <Popover
                      open={openPopover === pos}
                      onOpenChange={(open) => {
                        setOpenPopover(open ? pos : null);
                        if (!open) setSearch("");
                      }}
                    >
                      <PopoverTrigger asChild disabled={locked || saving}>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" /> Agregar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 p-0 shadow-xl border-surface-dark">
                        <div className="p-2 border-b border-surface-dark bg-surface-light/50">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="h-8 pl-8 text-xs bg-white"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-auto py-1">
                          {filteredPlayers.length > 0 ? (
                            filteredPlayers.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => onToggleItem(game.id, String(p.id), pos)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-indigo-50"
                              >
                                <Avatar p={p} size={24} />
                                <span className="text-sm font-medium">{p.nombre} {p.apellido}</span>
                                <span className="text-xs text-text-muted ml-auto">{p.team}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-6 text-center text-xs text-text-muted italic">
                              {search.trim()
                                ? "No se encontraron jugadores"
                                : "No hay jugadores disponibles"}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button type="button" variant="outline" size="sm" onClick={() => onFillRemaining(game.id, pos)} disabled={locked || saving}>
                      Completar resto
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {selected.length} {selected.length === 1 ? "equipo" : "equipos"}
                  </span>
                )}
              </div>

              {game.tipo === "individual" ? (
                selected.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.map((value) => {
                      const person = players.find((p) => String(p.id) === value);
                      return (
                        <div
                          key={value}
                          className="inline-flex items-center gap-1.5 rounded-full border border-surface-dark bg-white px-2.5 py-1 text-xs font-medium shadow-sm"
                        >
                          {person ? (
                            <>
                              <Avatar p={person} size={18} />
                              <span>{person.nombre} {person.apellido}</span>
                              <span className="text-text-muted">· {person.team}</span>
                            </>
                          ) : (
                            <span>{value}</span>
                          )}
                          <button
                            type="button"
                            disabled={locked || saving}
                            onClick={() => onToggleItem(game.id, value, pos)}
                            className="ml-0.5 rounded-full p-0.5 text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">Sin asignar</p>
                )
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeTeams.map((team) => {
                    const active = selected.includes(team);
                    return (
                      <button
                        key={team}
                        type="button"
                        disabled={locked || saving}
                        onClick={() => onToggleItem(game.id, team, pos)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-surface-dark bg-white hover:border-primary hover:text-primary"
                        }`}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
