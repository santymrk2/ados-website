"use client";

import { useState, useMemo, useCallback } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";

import { Gamepad2, Users, Plus, X, Search, Trash2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import { CountUp, Reveal } from "@/app/_components/home-ui";
import { TEAMS, PTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Empty } from "@/components/ui/Common";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/Avatar";
import { DetailSheet } from "@/components/ui/DetailSheet";
import { cn, normalizeText } from "@/lib/utils";
import { sectionTitleClass, toolbarButtonClass, savingTextClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
import { useTeamStyles } from "@/hooks/useTeamStyles";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { deleteGame, updateGameName } from "@/lib/activity-mutates";
import type { Juego, ParticipantBasic, Activity } from "@/lib/types";

const MIN_POSITIONS = 4;
type JuegoTipo = "grupal" | "individual";

// Team games: exactly one position per active team (the server rejects more).
// Individual games: at least the classic podium of 4.
function getPositions(teamCount: number, tipo: string | undefined) {
  const count = tipo === "individual" ? Math.max(MIN_POSITIONS, teamCount) : teamCount;
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

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
  onRename: (value: string) => void;
  onDelete: () => Promise<void>;
  onToggleItem: (gameId: number | string, itemId: string, pos: string) => void;
  onFillRemaining: (gameId: number | string, pos: string) => void;
}) {
  const { activity } = useUnifiedActivity();
  const teams = useTeamStyles(activity.teamSettings);
  const [localName, setLocalName] = useState(game.nombre || "");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const positions = getPositions(activeTeams.length, game.tipo);

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
    const q = normalizeText(search);
    return availablePlayers.filter((p) =>
      normalizeText(`${p.nombre} ${p.apellido}`).includes(q),
    );
  }, [availablePlayers, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </Button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {game.tipo === "individual" ? <Users className="h-3 w-3" /> : <Gamepad2 className="h-3 w-3" />}
            {gameTypeLabel(game.tipo || "grupal")}
          </span>
        </div>
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
        {positions.map((pos) => {
          const selected = (game.pos || {})[pos] || [];
          return (
            <div
              key={pos}
              className="rounded-2xl border border-border bg-card/20 p-3 space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground">
                    {pos}
                  </span>
                  <span className="font-bold">Puesto {pos}</span>
                  <span className="text-xs font-black text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {PTS.rec[Number(pos)] || 0} pts
                    </span>
                </div>
                {game.tipo === "individual" ? (
                  <div className="flex flex-col gap-1 sm:items-end">
                  <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                    <Popover
                      open={openPopover === pos}
                      onOpenChange={(open) => {
                        setOpenPopover(open ? pos : null);
                        if (!open) setSearch("");
                      }}
                    >
                      <PopoverTrigger asChild disabled={locked}>
                        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                          <Plus className="w-3 h-3 mr-1" /> Agregar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 p-0 shadow-xl border-border">
                        <div className="p-2 border-b border-border bg-card/50">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Buscar jugador..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="h-8 pl-8 text-sm bg-card"
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
                                className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-primary/10"
                              >
                                <Avatar p={p} size={24} />
                                <span className="text-base font-medium">{p.nombre} {p.apellido}</span>
                                <span className="text-sm text-muted-foreground ml-auto">{teams.name(p.team)}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground italic">
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
                      disabled={locked}
                      className="w-full sm:w-auto"
                    >
                      Asignar sin puesto aquí
                    </Button>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-right">
                      Pone en este puesto a todos los jugadores elegibles que todavía no tienen puesto.
                    </p>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-primary">
                    +{PTS.rec[Number(pos)] || 0} pts
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
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-sm font-medium"
                        >
                          {person ? (
                            <>
                              <Avatar p={person} size={18} />
                              <span>{person.nombre} {person.apellido}</span>
                              <span className="text-muted-foreground">· {teams.name(person.team)}</span>
                            </>
                          ) : (
                            <span>{value}</span>
                          )}
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => onToggleItem(game.id, value, pos)}
                            className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin asignar</p>
                )
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeTeams.map((team) => {
                    const active = selected.includes(team);
                    return (
                      <button
                        key={team}
                        type="button"
                        disabled={locked}
                        onClick={() => onToggleItem(game.id, team, pos)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-bold transition",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary hover:text-primary",
                        )}
                      >
                        {teams.name(team)}
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
  const teams = useTeamStyles(activity.teamSettings);
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

      const mutate = (act: Activity) => {
        const juegos = (act.juegos || []).map((j) =>
          j.id === gameId ? { ...j, pos: nextPos } : j,
        );
        return { ...act, juegos };
      };

      try {
        await performQuickUpdate("game_pos", { juegoId: gameId, pos: nextPos }, "juegos", mutate, (base) => ({
          prevPos: base.juegos?.find((j) => j.id === gameId)?.pos ?? {},
        }));
      } catch {
        // El revert ya lo hace optimisticUpdateActivity
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

  const handleDeleteGame = useCallback(
    async (gameId: number | string) => {
      setSaving(true);
      try {
        await performQuickUpdate(
          "game_delete",
          { id: gameId },
          "juegos",
          deleteGame(gameId),
        );
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
      // No-op: don't send if name didn't change
      const game = gameList.find((g) => g.id === gameId);
      if (game && game.nombre === nombre) return;

      setSaving(true);
      try {
        await performQuickUpdate(
          "game_update",
          { id: gameId, nombre },
          "juegos",
          updateGameName(gameId, nombre),
        );
      } catch {
        // Error already handled
      } finally {
        setSaving(false);
      }
    },
    [performQuickUpdate, gameList],
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
    return teams.name(value);
  };

  const renderReadMode = () => {
    if (gameList.length === 0) {
      return <Empty text="Sin juegos registrados" />;
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
              className="bg-card rounded-3xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 p-3 border-b border-border">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-base leading-tight">{j.nombre || `Juego ${index + 1}`}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 font-bold uppercase tracking-wide">
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

              <div className="flex flex-col divide-y divide-border/40">
                {getPositions(activeTeams.length, j.tipo).map((pos) => {
                  const values = (j.pos || {})[pos] || [];
                  return (
                    <div key={pos} className="flex items-center gap-2 text-sm py-2.5 px-4">
                      <span className="font-bold text-foreground/60 w-6">P{pos}</span>
                      <div className="flex flex-wrap gap-1">
                        {values.length > 0 ? (
                          values.map((value) => (
                            <span
                              key={`${pos}-${value}`}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                            >
                              {labelFor(j, value)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">{values.length}</span>
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
        <h2 className={sectionTitleClass}>Juegos</h2>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {syncStatus.state === "saving" && (
            <span className={savingTextClass}>Guardando...</span>
          )}
          {syncStatus.state === "error" && syncStatus.message && (
            <span className="text-xs text-destructive">{syncStatus.message}</span>
          )}
          <Button
            onClick={() => setCreateOpen(true)}
            variant="ghost"
            size="sm"
            disabled={locked || saving}
            className={`${toolbarButtonClass} font-black px-4`}
          >
            <Plus className="w-4 h-4 mr-1" /> Juego
          </Button>
          <Button onClick={stopEditing} size="sm" variant="ghost" className={`${toolbarButtonClass} font-black`}>
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
            className="text-left rounded-3xl border border-border bg-card p-5 transition hover:bg-muted/50 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-base">
                    {game.nombre || `Juego ${index + 1}`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {game.tipo === "individual" ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <Gamepad2 className="h-3 w-3" />
                    )}
                    {gameTypeLabel(game.tipo || "grupal")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{renderSummary(game)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await confirmDialog(
                    `¿Eliminar "${game.nombre || 'Juego ' + (gameList.indexOf(game) + 1)}"?`,
                    { title: "Eliminar juego", confirmText: "Eliminar", isDestructive: true },
                  );
                  if (confirmed) await handleDeleteGame(game.id);
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
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Agregar juego</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => addGame("grupal")}
              className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Gamepad2 className="h-4 w-4" />
                Juego grupal
              </div>
              <p className="mt-2 text-base text-muted-foreground">
                Equipos en posiciones y puntaje por equipo.
              </p>
            </button>
            <button
              type="button"
              onClick={() => addGame("individual")}
              className="rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-2 font-black">
                <Users className="h-4 w-4" />
                Juego individual
              </div>
              <p className="mt-2 text-base text-muted-foreground">
                Asigna personas a posiciones y suma puntos por participante.
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <DetailSheet
        open={!!selectedGame}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedGame ? (selectedGame.nombre || `Juego ${(gameList.indexOf(selectedGame) + 1)}`) : "Juego"}
      >
          {selectedGame && (
            <GameDetailModal
              game={selectedGame}
              activeTeams={activeTeams}
              players={eligiblePlayers}
              locked={locked}
              saving={saving}
              onRename={(nombre) => updateName(selectedGame.id, nombre)}
              onDelete={async () => {
                const confirmed = await confirmDialog(
                  `¿Eliminar "${selectedGame.nombre || 'Juego ' + (gameList.indexOf(selectedGame) + 1)}"?`,
                  { title: "Eliminar juego", confirmText: "Eliminar", isDestructive: true },
                );
                if (confirmed) await handleDeleteGame(selectedGame.id);
              }}
              onToggleItem={togglePositionItem}
              onFillRemaining={fillWithRemaining}
            />
          )}
      </DetailSheet>
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-3xl space-y-4">
      {isEditing ? (
        renderEditMode()
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <Reveal index={0}>
              <div className="flex items-baseline gap-2">
                <CountUp
                  value={gameList.length}
                  className="text-5xl font-black tracking-tight text-foreground"
                />
                <span className="text-base font-bold text-muted-foreground">
                  {gameList.length === 1 ? "juego" : "juegos"}
                </span>
              </div>
            </Reveal>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className={toolbarButtonClass}>
                Editar
              </Button>
            )}
          </div>
          {renderReadMode()}
        </>
      )}
    </div>
    </MotionConfig>
  );
}
