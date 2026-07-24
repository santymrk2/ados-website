"use client";

import { useState, useMemo } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";

import { Plus, Minus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, normalizeText } from "@/lib/utils";
import type { Gol, ParticipantBasic } from "@/lib/types";

const GOAL_TYPES = [
  { id: "f", label: "Fútbol", short: "F" },
  { id: "h", label: "Handball", short: "H" },
  { id: "b", label: "Básquet", short: "B" },
] as const;


function GoalRow({
  g,
  availablePlayers,
  onUpdate,
  onDelete,
  onCreate,
  locked,
  openDropdown,
  setOpenDropdown,
}: {
  g: Gol;
  availablePlayers: ParticipantBasic[];
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  onCreate: (tempId: number, goal: Gol) => void;
  locked: boolean;
  openDropdown: number | string | null;
  setOpenDropdown: (id: number | string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const selectedPlayer = availablePlayers.find((p) => p.id === g.pid);

  const filteredPlayers = search.trim()
    ? availablePlayers.filter((p) =>
        normalizeText(`${p.nombre} ${p.apellido}`).includes(normalizeText(search)),
      )
    : availablePlayers;

  const handleSelect = (pid: number) => {
    if (g.id === undefined || g.id === null) return;
    if (g.id < 0) {
      onCreate(g.id, { ...g, pid });
    } else {
      onUpdate(g.id, "pid", pid);
    }
    setOpenDropdown(null);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-border shadow-sm transition-all duration-200 hover:border-primary/30">
      <div className="flex-1 min-w-0">
        <Popover
          open={openDropdown === g.id}
          onOpenChange={(open) => setOpenDropdown(open ? g.id! : null)}
        >
          <PopoverTrigger asChild disabled={locked}>
            <button
              className={cn(
                "flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg hover:bg-card transition-colors",
                !selectedPlayer && "border border-dashed border-border py-1.5",
              )}
            >
              {selectedPlayer ? (
                <>
                  <Avatar p={selectedPlayer} size={28} />
                  <span className="text-sm font-medium truncate text-foreground">
                    {selectedPlayer.nombre} {selectedPlayer.apellido}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">
                    ?
                  </div>
                  <span className="text-sm text-muted-foreground italic">Seleccionar jugador...</span>
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0 shadow-xl border-border">
            <div className="p-2 border-b border-border bg-card/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
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
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-indigo-50",
                      p.id === g.pid && "bg-indigo-50/50",
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-sm font-medium">{p.nombre} {p.apellido}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground italic">
                  No se encontraron jugadores
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex bg-muted/50 p-0.5 rounded-lg shrink-0">
        {GOAL_TYPES.map((type) => (
          <button
            key={type.id}
            disabled={locked}
            onClick={() => g.id != null && onUpdate(g.id, "tipo", type.id)}
            className={cn(
              "px-2 py-1 rounded-md text-[10px] font-black transition-all",
              g.tipo === type.id
              ? "bg-white text-primary shadow-sm"
                : "text-white/70 hover:text-white",
            )}
          >
            <span className="hidden sm:inline">{type.label}</span>
            <span className="sm:hidden">{type.short}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-card rounded-lg px-1 shrink-0">
        <button
          disabled={locked || (g.cant || 1) <= 1}
          onClick={() => g.id != null && onUpdate(g.id, "cant", (g.cant || 1) - 1)}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-4 text-center text-xs font-black text-foreground">
          {g.cant || 1}
        </span>
        <button
          disabled={locked}
          onClick={() => g.id != null && onUpdate(g.id, "cant", (g.cant || 1) + 1)}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Button
        onClick={() => onDelete(g.id!)}
        variant="ghost"
        size="icon"
        disabled={locked}
        className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function GolesSection() {
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

  const [openDropdown, setOpenDropdown] = useState<number | string | null>(null);

  const isEditing = editingSection === "goles";

  const participants = useMemo(
    () => db.participants.filter((p) => activity.asistentes.includes(p.id)),
    [db.participants, activity.asistentes],
  );

  const goles = useMemo(() => activity.goles || [], [activity.goles]);
  const golesManuales = useMemo(() => goles.filter((g: Gol) => !g.matchId), [goles]);

  const bySport = useMemo(() => {
    const sportTotals: Record<string, { total: number; players: Record<number, number> }> = {};
    goles.forEach((g: Gol) => {
      const tipo = g.tipo || "f";
      if (!sportTotals[tipo]) sportTotals[tipo] = { total: 0, players: {} };
      sportTotals[tipo].total += g.cant || 0;
      if (g.pid) {
        sportTotals[tipo].players[g.pid] =
          (sportTotals[tipo].players[g.pid] || 0) + (g.cant || 0);
      }
    });
    return sportTotals;
  }, [goles]);

  const allPlayersTotal = useMemo(() => {
    const totals: Record<number, number> = {};
    goles.forEach((g: Gol) => {
      if (g.pid) totals[g.pid] = (totals[g.pid] || 0) + (g.cant || 0);
    });
    return Object.entries(totals)
      .map(([pid, total]) => ({
        pid: Number(pid),
        total,
        participant: db.participants.find((p) => p.id === Number(pid)) || null,
      }))
      .sort((a, b) => b.total - a.total);
  }, [goles, db.participants]);

  const add = () => {
    const tempId = -(Date.now());
    performQuickUpdate(
      "goal_add",
      { id: tempId, pid: null, tipo: "f", cant: 1 },
      "goles",
    ).catch(() => {
      // Error already handled by performQuickUpdate
    });
  };

  const del = async (id: number) => {
    try {
      await performQuickUpdate(
        "goal_remove",
        { id, goles: goles.filter((g: Gol) => g.id !== id) },
        "goles",
      );
    } catch {
      // Error already handled
    }
  };

  const upd = async (id: number, k: string, v: unknown) => {
    try {
      await performQuickUpdate(
        "goal_update",
        {
          id,
          [k]: v,
          goles: goles.map((g: Gol) => (g.id === id ? { ...g, [k]: v } : g)),
        },
        "goles",
      );
    } catch {
      // Error already handled
    }
  };

  const createOnServer = async (tempId: number, goal: Gol) => {
    if (!goal.pid) return;
    try {
      await performQuickUpdate(
        "goal_add",
        { pid: goal.pid, tipo: goal.tipo, cant: goal.cant, goles: [...goles, goal] },
        "goles",
      );
    } catch {
      // Error already handled by performQuickUpdate
    }
  };

  const startEditing = () => setEditingSection("goles");
  const stopEditing = () => setEditingSection(null);

  return (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Goles Manuales</h2>
            <div className="flex items-center gap-2">
              {syncStatus.state === "saving" && (
                <span className="text-[10px] text-white/60 animate-pulse">Guardando...</span>
              )}
              {syncStatus.state === "error" && syncStatus.message && (
                <span className="text-[10px] text-red-300">{syncStatus.message}</span>
              )}
              <Button
                onClick={add}
                variant="ghost"
                size="sm"
                disabled={locked}
                className="bg-white/20 text-white hover:bg-white/30 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </Button>
              <Button onClick={stopEditing} size="sm" variant="ghost" className="font-black bg-white/20 text-white hover:bg-white/30">
                Listo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {golesManuales.length > 0 ? (
              golesManuales.map((g: Gol) => (
                <GoalRow
                  key={g.id}
                  g={g}
                  availablePlayers={participants}
                  onUpdate={upd}
                  onDelete={del}
                  onCreate={createOnServer}
                  locked={locked}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card/30">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No hay goles registrados</p>
                <Button
                  onClick={add}
                  variant="outline"
                  size="sm"
                  disabled={locked}
                  className="border-primary/30 text-primary hover:bg-indigo-50"
                >
                  Registrar primer gol
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-white">Goles</h2>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className="bg-white/20 text-white hover:bg-white/30">
                Editar
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 text-xs font-bold text-white/60 mb-4">
            <span>⚽ {bySport.f?.total || 0}</span>
            <span>·</span>
            <span>🤾 {bySport.h?.total || 0}</span>
            <span>·</span>
            <span>🏀 {bySport.b?.total || 0}</span>
          </div>

          {allPlayersTotal.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/70">
                Por jugador
              </h3>
              <div className="flex flex-col gap-1">
                {allPlayersTotal.map((p, i) => (
                  <div
                    key={p.pid}
                    className="bg-white/90 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60">
                      {i + 1}
                    </div>
                    {p.participant && <Avatar p={p.participant} size={30} />}
                    <div className="flex-1">
                      <div className="font-bold text-sm">
                        {p.participant
                          ? `${p.participant.nombre} ${p.participant.apellido}`
                          : "Desconocido"}
                      </div>
                    </div>
                    <div className="font-black text-lg">{p.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-white/60">No hay goles registrados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
