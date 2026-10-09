"use client";

import { useState, useMemo, useRef } from "react";
import { useUnifiedActivity } from "@/lib/activity-context";

import { Plus, Minus, X, Search } from "lucide-react";
import { MotionConfig } from "framer-motion";
import { GroupedList } from "@/components/ui/GroupedList";
import { CountUp, EmptyBlock, LeaderRow, Reveal } from "@/app/_components/home-ui";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, normalizeText } from "@/lib/utils";
import { sectionTitleClass, toolbarButtonClass, savingTextClass } from "@/app/activities/[id]/(unified)/_components/ui-classes";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { removeGoal, updateGoal } from "@/lib/activity-mutates";
import type { Gol, ParticipantBasic } from "@/lib/types";

const GOAL_TYPES = [
  { id: "f", label: "Fútbol", short: "⚽ F" },
  { id: "h", label: "Handball", short: "🤾 H" },
  { id: "b", label: "Básquet", short: "🏀 B" },
] as const;


function GoalRow({
  g,
  availablePlayers,
  onUpdate,
  onDelete,
  onCreate,
  locked,
  saving,
  openDropdown,
  setOpenDropdown,
}: {
  g: Gol;
  availablePlayers: ParticipantBasic[];
  onUpdate: (id: number, key: string, value: unknown) => void;
  onDelete: (id: number) => void;
  onCreate: (tempId: number, goal: Gol) => void;
  locked: boolean;
  saving: boolean;
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
    <div className="flex items-center gap-2 px-4 py-3 transition-colors hover:bg-muted/50">
      <div className="flex-1 min-w-0">
        <Popover
          open={openDropdown === g.id}
          onOpenChange={(open) => setOpenDropdown(open ? g.id! : null)}
        >
          <PopoverTrigger asChild disabled={locked || saving}>
            <button
              className={cn(
                "flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg hover:bg-card transition-colors",
                !selectedPlayer && "border border-dashed border-border py-1.5",
              )}
            >
              {selectedPlayer ? (
                <>
                  <Avatar p={selectedPlayer} size={28} />
                  <span className="text-base font-medium truncate text-foreground">
                    {selectedPlayer.nombre} {selectedPlayer.apellido}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
                    ?
                  </div>
                  <span className="text-base text-muted-foreground italic">Seleccionar jugador...</span>
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
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-primary/5",
                      p.id === g.pid && "bg-primary/10",
                    )}
                  >
                    <Avatar p={p} size={24} />
                    <span className="text-base font-medium">{p.nombre} {p.apellido}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground italic">
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
            disabled={locked || saving}
            onClick={() => g.id != null && onUpdate(g.id, "tipo", type.id)}
            className={cn(
              "px-2 py-1 rounded-md text-xs font-black transition-all",
              g.tipo === type.id
              ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">{type.label}</span>
            <span className="sm:hidden">{type.short}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-card rounded-lg px-1 shrink-0">
        <button
          disabled={locked || saving || (g.cant || 1) <= 1}
          onClick={() => g.id != null && onUpdate(g.id, "cant", (g.cant || 1) - 1)}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-4 text-center text-sm font-black text-foreground">
          {g.cant || 1}
        </span>
        <button
          disabled={locked || saving}
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
        disabled={locked || saving}
        className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
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
  const [saving, setSaving] = useState(false);
  // Goals without a player yet live only in the client (negative ids) until a player is picked
  const [draftGoles, setDraftGoles] = useState<Gol[]>([]);
  // Drafts being persisted: guards double submits without dropping a second draft saved meanwhile
  const persistingDrafts = useRef(new Set<number>());

  const isEditing = editingSection === "goles";

  const participants = useMemo(
    () => db.participants.filter((p) => activity.asistentes.includes(p.id)),
    [db.participants, activity.asistentes],
  );

  const goles = useMemo(() => activity.goles || [], [activity.goles]);
  const golesManuales = useMemo(
    () => [...goles.filter((g: Gol) => !g.matchId), ...draftGoles],
    [goles, draftGoles],
  );

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
    if (locked || saving) return;
    const tempId = -(Date.now());
    setDraftGoles((prev) => [...prev, { id: tempId, pid: null, tipo: "f", cant: 1 } as Gol]);
  };

  const del = async (id: number) => {
    if (id < 0) {
      setDraftGoles((prev) => prev.filter((g) => g.id !== id));
      return;
    }
    if (locked || saving) return;
    const confirmed = await confirmDialog("¿Eliminar este gol?", {
      title: "Eliminar gol",
      confirmText: "Eliminar",
      isDestructive: true,
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await performQuickUpdate(
        "goal_remove",
        { id },
        "goles",
        removeGoal(id),
      );
    } catch {
      // Error already handled
    } finally {
      setSaving(false);
    }
  };

  const upd = async (id: number, k: string, v: unknown) => {
    if (id < 0) {
      setDraftGoles((prev) => prev.map((g) => (g.id === id ? { ...g, [k]: v } : g)));
      return;
    }
    if (locked || saving) return;
    setSaving(true);
    try {
      await performQuickUpdate(
        "goal_update",
        { id, [k]: v },
        "goles",
        updateGoal(id, { [k]: v } as Partial<Pick<Gol, "pid" | "tipo" | "cant">>),
      );
    } catch {
      // Error already handled
    } finally {
      setSaving(false);
    }
  };

  const createOnServer = async (tempId: number, goal: Gol) => {
    if (!goal.pid || locked) return;
    // Keep the chosen player on the draft so it survives a failed save
    setDraftGoles((prev) => prev.map((g) => (g.id === tempId ? { ...g, pid: goal.pid } : g)));
    if (persistingDrafts.current.has(tempId)) return;
    persistingDrafts.current.add(tempId);
    setSaving(true);
    try {
      await performQuickUpdate(
        "goal_add",
        { pid: goal.pid, tipo: goal.tipo, cant: goal.cant },
        "goles",
      );
      setDraftGoles((prev) => prev.filter((g) => g.id !== tempId));
    } catch {
      // Error already handled by performQuickUpdate; the draft stays so the user can retry
    } finally {
      persistingDrafts.current.delete(tempId);
      setSaving(persistingDrafts.current.size > 0);
    }
  };

  const startEditing = () => setEditingSection("goles");
  const stopEditing = () => {
    setDraftGoles([]);
    setEditingSection(null);
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-3xl space-y-4">
      {isEditing ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className={sectionTitleClass}>Goles Manuales</h2>
            <div className="flex items-center gap-2">
              {syncStatus.state === "saving" && (
                <span className={savingTextClass}>Guardando...</span>
              )}
              {syncStatus.state === "error" && syncStatus.message && (
                <span className="text-xs text-destructive">{syncStatus.message}</span>
              )}
              <Button
                onClick={add}
                variant="ghost"
                size="sm"
                disabled={locked || saving}
                className={`${toolbarButtonClass} flex items-center gap-1`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </Button>
              <Button onClick={stopEditing} size="sm" variant="ghost" className={`${toolbarButtonClass} font-black`}>
                Listo
              </Button>
            </div>
          </div>

          <div>
            {golesManuales.length > 0 ? (
              <GroupedList>
              {golesManuales.map((g: Gol) => (
                <GoalRow
                  key={g.id}
                  g={g}
                  availablePlayers={participants}
                  onUpdate={upd}
                  onDelete={del}
                  onCreate={createOnServer}
                  locked={locked}
                  saving={saving}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ))}
              </GroupedList>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card/30">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-base text-muted-foreground mb-4">No hay goles registrados</p>
                <Button
                  onClick={add}
                  variant="outline"
                  size="sm"
                  disabled={locked || saving}
                  className="border-primary/30 text-primary hover:bg-primary/5"
                >
                  Registrar primer gol
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <Reveal index={0}>
              <div className="flex items-baseline gap-2">
                <CountUp
                  value={(bySport.f?.total || 0) + (bySport.h?.total || 0) + (bySport.b?.total || 0)}
                  className="text-5xl font-black tracking-tight text-foreground"
                />
                <span className="text-base font-bold text-muted-foreground">goles</span>
              </div>
            </Reveal>
            {isAdmin && (
              <Button onClick={startEditing} variant="ghost" size="sm" className={toolbarButtonClass}>
                Editar
              </Button>
            )}
          </div>

          <Reveal index={1}>
            <div className="grid grid-cols-3 divide-x divide-border rounded-3xl border border-border bg-card py-5 text-center">
              {GOAL_TYPES.map((type) => (
                <div key={type.id}>
                  <CountUp
                    value={bySport[type.id]?.total || 0}
                    className="text-3xl font-black tracking-tight text-foreground"
                  />
                  <div className="mt-1 text-sm font-bold text-muted-foreground">{type.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {allPlayersTotal.length > 0 && (
            <Reveal index={2}>
              <div className="space-y-2">
                <h3 className="px-1 text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Por jugador
                </h3>
                <GroupedList>
                  {allPlayersTotal.map((p, i) => (
                    <LeaderRow
                      key={p.pid}
                      p={p.participant ?? { nombre: "Desconocido", apellido: "", sexo: null }}
                      pos={i + 1}
                      value={p.total}
                      unit={p.total === 1 ? "gol" : "goles"}
                      max={allPlayersTotal[0].total}
                    />
                  ))}
                </GroupedList>
              </div>
            </Reveal>
          )}

          {goles.length === 0 && <EmptyBlock text="No hay goles registrados" />}
        </>
      )}
    </div>
    </MotionConfig>
  );
}
