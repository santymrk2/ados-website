"use client";

import { useState, useMemo, useCallback } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";

import { Gamepad2, Users, Plus, X, Search, Trash2 } from "lucide-react";
import { TEAMS, PTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Empty } from "@/components/ui/Common";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Juego, ParticipantBasic } from "@/lib/types";

const POSITIONS = ["1", "2", "3", "4"] as const;
type JuegoTipo = "grupal" | "individual";

function gameTypeLabel(tipo: string | undefined) {
  return tipo === "individual" ? "Individual" : "Grupal";
}

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
  const [showPtsPos, setShowPtsPos] = useState<string | null>(null);

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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={saving}
          onClick={onDelete}
          className="shrink-0 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1 space-y-2 text-center">
          <DialogHeader>
            <DialogTitle>Detalle del juego</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
              {game.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
              {gameTypeLabel(game.tipo || "grupal")}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0"
        >
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
            <div
              key={pos}
              className="rounded-2xl border border-surface-dark bg-surface-light/20 p-3 space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => setShowPtsPos(showPtsPos === pos ? null : pos)}
                  className="flex items-center gap-2"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                    {pos}
                  </span>
                  <span className="font-bold">Puesto {pos}</span>
                  {showPtsPos === pos && (
                    <span className="text-[10px] font-black text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {PTS.rec[Number(pos)] || 0} pts
                    </span>
                  )}
                </button>
                {game.tipo === "individual" ? (
                  <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                    <Popover
                      open={openPopover === pos}
                      onOpenChange={(open) => {
                        setOpenPopover(open ? pos : null);
                        if (!open) setSearch("");
                      }}
                    >
                      <PopoverTrigger asChild disabled={locked || saving}>
                        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onFillRemaining(game.id, pos)}
                      disabled={locked || saving}
                      className="w-full sm:w-auto"
                    >
                      Completar resto
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-white/70">
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
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-surface-dark bg-white hover:border-primary hover:text-primary",
                        )}
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

type ParticipantOption = ParticipantBasic & { team: string };

export function JuegosSection() {
  const {
    activity,
    db,
    locked,
    isAdmin,
    syncStatus,
    editingSection,
    setEditingSection,
    performQuickUpdate,
  } = useUnifiedActivity();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = editingSection === "juegos";
  const participants = db.participants;
  const activeTeams = useMemo(
    () => TEAMS.slice(0, activity.cantEquipos || 4),
    [activity.cantEquipos],
  );
  const gameList = useMemo(() => activity.juegos || [], [activity.juegos]);

  const eligiblePlayers = useMemo(() => {
    return participants
      .filter(
        (p) =>
          activity.asistentes.includes(p.id) && activity.equipos?.[String(p.id)],
      )
      .map((p) => ({ ...p, team: activity.equipos?.[String(p.id)] || "" }))
      .filter((p) => activeTeams.includes(p.team))
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      );
  }, [participants, activity.asistentes, activity.equipos, activeTeams]);

  const selectedGame = useMemo(
    () => gameList.find((game) => game.id === selectedId) || null,
    [gameList, selectedId],
  );

  const participantById = useMemo(() => {
    const map = new Map<number, (typeof participants)[number]>();
    for (const p of participants) {
      map.set(p.id, p);
    }
    return map;
  }, [participants]);

  const commitGamePositions = useCallback(
    async (gameId: number | string, nextPos: Record<string, string[]>) => {
      if (typeof gameId === "string" && String(gameId).startsWith("temp")) return;

      setSaving(true);
      try {
        await performQuickUpdate("game_pos", { juegoId: gameId, pos: nextPos }, "juegos");
      } catch {
        // Error already handled
      } finally {
        setSaving(false);
      }
    },
    [performQuickUpdate],
  );

  const addGame = useCallback(
    async (tipo: JuegoTipo) => {
      if (locked) return;

      setSaving(true);
      try {
        await performQuickUpdate("game_add", { nombre: "", tipo, pos: {} }, "juegos");
        setCreateOpen(false);
      } catch {
        // Error already handled
      } finally {
        setSaving(false);
      }
    },
    [locked, performQuickUpdate],
  );

  const deleteGame = useCallback(
    async (gameId: number | string) => {
      setSaving(true);
      try {
        await performQuickUpdate("game_delete", { id: gameId }, "juegos");
        if (selectedId === gameId) setSelectedId(null);
      } catch {
        // Error already handled
      } finally {
        setSaving(false);
      }
    },
    [performQuickUpdate, selectedId],
  );

  const updateName = useCallback(
    async (gameId: number | string, nombre: string) => {
      setSaving(true);
      try {
        await performQuickUpdate("game_update", { id: gameId, nombre }, "juegos");
      } catch {
        // Error already handled
      } finally {
        setSaving(false);
      }
    },
    [performQuickUpdate],
  );

  const togglePositionItem = useCallback(
    (gameId: number | string, itemId: string, pos: string) => {
      const game = gameList.find((item) => item.id === gameId);
      if (!game) return;
      commitGamePositions(gameId, computeNewPos(game.pos || {}, itemId, pos));
    },
    [gameList, commitGamePositions],
  );

  const fillWithRemaining = useCallback(
    (gameId: number | string, pos: string) => {
      const game = gameList.find((item) => item.id === gameId);
      if (!game) return;
      const allIds = eligiblePlayers.map((player) => String(player.id));
      commitGamePositions(gameId, fillRemainingPos(game.pos || {}, pos, allIds));
    },
    [gameList, commitGamePositions, eligiblePlayers],
  );

  const renderSummary = useCallback((game: Juego) => {
    const groups = Object.entries(game.pos || {}).filter(([pos]) => pos !== "0");
    const total = groups.reduce((acc, [, values]) => acc + values.length, 0);
    return `${gameTypeLabel(game.tipo || "grupal")} · ${groups.length} posiciones · ${total} asignados`;
  }, []);

  const startEditing = () => setEditingSection("juegos");
  const stopEditing = () => setEditingSection(null);

  const labelFor = (game: Juego, value: string) => {
    if (game.tipo === "individual") {
      const p = participantById.get(Number(value));
      return p ? `${p.nombre} ${p.apellido}` : value;
    }
    return value;
  };

  const renderReadMode = () => {
    if (gameList.length === 0) {
      return <Empty text="Sin juegos registrados" className="text-white/60" />;
    }

    return (
      <div className="flex flex-col gap-4">
        {gameList.map((j: Juego, index) => {
          const posEntries = Object.entries(j.pos || {})
            .filter(([pos]) => pos !== "0")
            .sort(([a], [b]) => Number(a) - Number(b));

          return (
            <div
              key={String(j.id)}
              className="bg-white rounded-2xl border border-surface-dark overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 p-3 border-b border-surface-dark">
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{j.nombre || `Juego ${index + 1}`}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 font-bold uppercase tracking-wide">
                      {j.tipo === "individual" ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <Gamepad2 className="h-3 w-3" />
                      )}
                      {gameTypeLabel(j.tipo)}
                    </span>
                    <span>{posEntries.length} puestos</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-2">
                {POSITIONS.map((pos) => {
                  const values = (j.pos || {})[pos] || [];
                  return (
                    <div
                      key={pos}
                      className="rounded-2xl border border-surface-dark/60 bg-surface-light/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-black uppercase tracking-wide text-white/70">
                          Puesto {pos}
                        </div>
                        <div className="text-[11px] font-medium text-text-muted">
                          {values.length} asignados
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {values.length > 0 ? (
                          values.map((value) => {
                            const isTeam = j.tipo === "grupal";
                            // teamColor removed (unused)
                            return (
                              <span
                                key={`${pos}-${value}`}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  isTeam
                                    ? "bg-white"
                                    : "border-surface-dark/50 bg-white text-foreground",
                                )}
                              >
                                {labelFor(j, value)}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs font-medium text-text-muted">
                            Sin asignar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEditMode = () => (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-black text-white">Juegos</h2>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {syncStatus.state === "saving" && (
            <span className="text-[10px] text-white/60 animate-pulse">Guardando...</span>
          )}
          {syncStatus.state === "error" && syncStatus.message && (
            <span className="text-[10px] text-red-300">{syncStatus.message}</span>
          )}
          <Button
            onClick={() => setCreateOpen(true)}
            variant="ghost"
            size="sm"
            disabled={locked || saving}
            className="bg-white/20 text-white font-black px-4 hover:bg-white/30"
          >
            <Plus className="w-4 h-4 mr-1" /> Juego
          </Button>
          <Button onClick={stopEditing} size="sm" variant="ghost" className="font-black bg-white/20 text-white hover:bg-white/30">
            Listo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {gameList.map((game, index) => (
          <div
            key={String(game.id)}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(game.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedId(game.id);
            }}
            className="text-left rounded-2xl border border-surface-dark bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm truncate">
                    {game.nombre || `Juego ${index + 1}`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-dark/60 bg-surface-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                    {game.tipo === "individual" ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <Gamepad2 className="h-3 w-3" />
                    )}
                    {gameTypeLabel(game.tipo || "grupal")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/70">{renderSummary(game)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 hover:bg-red-50 hover:text-red-500"
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteGame(game.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {gameList.length === 0 && <Empty text="Sin juegos registrados" className="text-white/60" />}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar juego</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => addGame("grupal")}
              className="rounded-2xl border border-surface-dark bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Gamepad2 className="h-4 w-4" />
                Juego grupal
              </div>
              <p className="mt-2 text-sm text-white/70">
                Equipos en posiciones y puntaje por equipo.
              </p>
            </button>
            <button
              type="button"
              onClick={() => addGame("individual")}
              className="rounded-2xl border border-surface-dark bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Users className="h-4 w-4" />
                Juego individual
              </div>
              <p className="mt-2 text-sm text-white/70">
                Asigna personas a posiciones y suma puntos por participante.
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedGame}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
          showCloseButton={false}
        >
          {selectedGame && (
            <GameDetailModal
              game={selectedGame}
              activeTeams={activeTeams}
              players={eligiblePlayers}
              locked={locked}
              saving={saving}
              onClose={() => setSelectedId(null)}
              onRename={(nombre) => updateName(selectedGame.id, nombre)}
              onDelete={async () => deleteGame(selectedGame.id)}
              onToggleItem={togglePositionItem}
              onFillRemaining={fillWithRemaining}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="space-y-4">
      {isEditing ? (
        renderEditMode()
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Juegos</h2>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                Editar
              </Button>
            )}
          </div>
          {renderReadMode()}
        </>
      )}
    </div>
  );
}
