"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useEditContext } from "../layout";
import { toast } from "@/hooks/use-toast";
import { Plus, Minus, Trash2 } from "lucide-react";
import { TEAMS, TEAM_COLORS, getTeamBg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import type { Extra, ParticipantBasic } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtraTipo = "extra" | "descuento";

interface AdjustmentItem extends Extra {
  id: number;
  tipo: ExtraTipo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listKey(tipo: ExtraTipo): "extras" | "descuentos" {
  return tipo === "extra" ? "extras" : "descuentos";
}

function addKey(tipo: ExtraTipo, pid: number | null, team: string | null): string {
  return `${team ? `team:${team}` : `pid:${pid}`}:${tipo}:add`;
}

function balance(items: AdjustmentItem[]): number {
  return items.reduce(
    (s, x) => s + (x.tipo === "extra" ? x.puntos : -x.puntos),
    0,
  );
}

// ---------------------------------------------------------------------------
// AdjustmentRow
// ---------------------------------------------------------------------------

function AdjustmentRow({
  item,
  saving,
  locked,
  onUpdatePoints,
  onUpdateMotivo,
  onDelete,
}: {
  item: AdjustmentItem;
  saving: boolean;
  locked: boolean;
  onUpdatePoints: (v: number) => void;
  onUpdateMotivo: (v: string) => void;
  onDelete: () => void;
}) {
  const [editingPoints, setEditingPoints] = useState(false);
  const [pointsInput, setPointsInput] = useState(String(item.puntos));
  const [editingMotivo, setEditingMotivo] = useState(false);
  const [motivoInput, setMotivoInput] = useState(item.motivo || "");
  const originalPuntos = useRef(item.puntos);
  const originalMotivo = useRef(item.motivo || "");

  const color = item.tipo === "extra" ? "#22C55E" : "#FF6B6B";
  const disabled = locked || saving || item.id < 0;

  const commitMotivo = () => {
    setEditingMotivo(false);
    const v = motivoInput.trim();
    if (v === (item.motivo || "")) return;
    onUpdateMotivo(v);
  };

  const commitPoints = async () => {
    setEditingPoints(false);
    const v = parseInt(pointsInput, 10);
    if (isNaN(v) || v < 0) {
      setPointsInput(String(item.puntos));
      return;
    }
    if (v === item.puntos) return;

    if (v === 0) {
      const ok = await confirmDialog(
        "Este ajuste quedará registrado sin modificar el puntaje.",
        {
          title: "¿Guardar ajuste en 0 puntos?",
          confirmText: "Guardar 0",
          isDestructive: false,
        },
      );
      if (!ok) {
        setPointsInput(String(item.puntos));
        return;
      }
    }

    onUpdatePoints(v);
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1"
      style={{
        backgroundColor:
          item.tipo === "extra"
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(255, 107, 107, 0.08)",
      }}
    >
      {/* Badge */}
      <span
        className={cn(
          "text-[10px] font-bold uppercase shrink-0 w-7",
          item.tipo === "extra" ? "text-green-600" : "text-red-600",
        )}
      >
        {item.tipo === "extra" ? "Extra" : "Desc"}
      </span>

      {/* Motivo */}
      {editingMotivo ? (
        <input
          autoFocus
          placeholder="Motivo..."
          value={motivoInput}
          disabled={disabled}
          onChange={(e) => setMotivoInput(e.target.value)}
          onBlur={commitMotivo}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitMotivo();
            if (e.key === "Escape") {
              setMotivoInput(originalMotivo.current);
              setEditingMotivo(false);
            }
          }}
          className="h-6 min-w-0 flex-1 bg-white rounded border border-primary outline-none text-[10px] text-foreground placeholder:text-text-muted px-1"
        />
      ) : (
        <span
          className={cn(
            "h-6 min-w-0 flex-1 text-[10px] truncate cursor-pointer hover:bg-white/60 hover:rounded px-0.5 transition-colors self-center leading-6",
            motivoInput ? "text-foreground" : "text-text-muted",
          )}
          onClick={() => {
            if (disabled) return;
            originalMotivo.current = motivoInput;
            setEditingMotivo(true);
          }}
          title="Click para editar"
        >
          {motivoInput || "Motivo..."}
        </span>
      )}

      {/* Points controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          disabled={disabled}
          onClick={() => onUpdatePoints(Math.max(0, item.puntos - 1))}
          className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors disabled:opacity-30"
          aria-label="Restar punto"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        {editingPoints ? (
          <input
            autoFocus
            type="number"
            min="0"
            className="w-8 text-center text-[10px] font-black bg-white rounded border border-primary outline-none p-0 h-5"
            style={{ color }}
            value={pointsInput}
            onChange={(e) => setPointsInput(e.target.value)}
            onBlur={commitPoints}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitPoints();
              if (e.key === "Escape") {
                setPointsInput(String(originalPuntos.current));
                setEditingPoints(false);
              }
            }}
          />
        ) : (
          <span
            className="w-5 text-center text-[10px] font-black cursor-pointer hover:bg-white hover:rounded px-0.5 transition-colors"
            style={{ color }}
            onClick={() => {
              if (disabled) return;
              originalPuntos.current = item.puntos;
              setPointsInput(String(item.puntos));
              setEditingPoints(true);
            }}
            title="Click para editar"
          >
            {item.puntos}
          </span>
        )}

        <button
          disabled={disabled}
          onClick={() => onUpdatePoints(item.puntos + 1)}
          className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-teal-500 transition-colors disabled:opacity-30"
          aria-label="Sumar punto"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={locked}
        className="w-5 h-5 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors disabled:opacity-30 shrink-0"
        aria-label="Eliminar ajuste"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExtrasPage
// ---------------------------------------------------------------------------

export default function ExtrasPage() {
  const {
    activity: act,
    setLocal,
    syncWithServer,
    db,
    locked,
    searchQuery,
    setFilterContent,
    setFiltersActive,
  } = useEditContext();

  const savingRef = useRef(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"apellido" | "nombre">("apellido");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ---- Filter content (sort toggle) ----

  useEffect(() => {
    setFiltersActive(sortBy !== "apellido" || sortOrder !== "asc");
    setFilterContent(
      <div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Ordenar por
        </span>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSortBy("apellido")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortBy === "apellido"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Apellido
          </button>
          <button
            onClick={() => setSortBy("nombre")}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors border",
              sortBy === "nombre"
                ? "bg-primary text-white border-primary"
                : "bg-white text-foreground border-border hover:bg-surface-light",
            )}
          >
            Nombre
          </button>
        </div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
          Dirección
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
    return () => {
      setFilterContent(null);
      setFiltersActive(false);
    };
  }, [sortBy, sortOrder, setFilterContent, setFiltersActive]);

  // ---- Derived data ----

  const eligiblePlayers = useMemo(
    () =>
      db.participants.filter((p: ParticipantBasic) =>
        act.asistentes.includes(p.id),
      ),
    [db.participants, act.asistentes],
  );

  const filteredPlayers = useMemo(() => {
    const base = searchQuery.trim()
      ? eligiblePlayers.filter((p: ParticipantBasic) =>
          `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...eligiblePlayers];
    base.sort((a, b) => {
      const nameA = sortBy === "nombre" ? `${a.nombre} ${a.apellido}` : `${a.apellido} ${a.nombre}`;
      const nameB = sortBy === "nombre" ? `${b.nombre} ${b.apellido}` : `${b.apellido} ${b.nombre}`;
      return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
    });
    if (sortOrder === "desc") base.reverse();
    return base;
  }, [eligiblePlayers, searchQuery, sortBy, sortOrder]);

  const activeTeams = useMemo(
    () => TEAMS.slice(0, act.cantEquipos || 4),
    [act.cantEquipos],
  );

  const adjustments = useMemo<AdjustmentItem[]>(() => {
    const extras: AdjustmentItem[] = (act.extras || []).map((e) => ({
      ...e,
      id: e.id!,
      tipo: "extra" as const,
    }));
    const descuentos: AdjustmentItem[] = (act.descuentos || []).map((e) => ({
      ...e,
      id: e.id!,
      tipo: "descuento" as const,
    }));
    return [...extras, ...descuentos].sort((a, b) => {
      if (a.team && !b.team) return -1;
      if (!a.team && b.team) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  }, [act.extras, act.descuentos]);

  // ---- Handlers ----

  const addAdjustment = useCallback(
    async (
      pid: number | null,
      team: string | null,
      tipo: ExtraTipo,
    ) => {
      if (locked || savingRef.current) return;

      const key = addKey(tipo, pid, team);
      savingRef.current = true;
      setSavingKey(key);

      try {
        const result = (await syncWithServer("extra_add", {
          pid,
          team,
          tipo,
          puntos: 1,
          motivo: tipo === "extra" ? "Premio" : "Sanción",
        })) as { id: number; participantId?: number | null; team?: string | null; puntos?: number; motivo?: string | null };

        const lk = listKey(tipo);
        setLocal(
          lk,
          (prev: Extra[]) => [
            ...(prev || []),
            {
              id: result.id,
              pid: result.participantId ?? pid,
              team: result.team ?? team ?? null,
              tipo,
              puntos: result.puntos ?? 1,
              motivo: result.motivo ?? (tipo === "extra" ? "Premio" : "Sanción"),
            },
          ],
          true,
        );
      } catch {
        toast.error("Error al agregar ajuste");
      } finally {
        savingRef.current = false;
        setSavingKey(null);
      }
    },
    [locked, syncWithServer, setLocal],
  );

  const updateAdjustment = useCallback(
    async (item: AdjustmentItem, patch: Partial<Pick<AdjustmentItem, "puntos" | "motivo">>) => {
      if (locked || savingRef.current) return;

      const key = `update:${item.id}`;
      savingRef.current = true;
      setSavingKey(key);

      try {
        await syncWithServer("extra_update", {
          id: item.id,
          pid: item.pid,
          team: item.team,
          puntos: patch.puntos ?? item.puntos,
          motivo: patch.motivo ?? item.motivo,
        });

        const lk = listKey(item.tipo);
        setLocal(lk, (prev: Extra[]) =>
          (prev || []).map((e) =>
            e.id === item.id ? { ...e, ...patch } : e,
          ),
          true,
        );
      } catch {
        toast.error("Error al guardar ajuste");
      } finally {
        savingRef.current = false;
        setSavingKey(null);
      }
    },
    [locked, syncWithServer, setLocal],
  );

  const deleteAdjustment = useCallback(
    async (item: AdjustmentItem) => {
      if (locked || savingRef.current) return;

      const key = `delete:${item.id}`;
      savingRef.current = true;
      setSavingKey(key);

      try {
        await syncWithServer("extra_delete", { id: item.id });

        const lk = listKey(item.tipo);
        setLocal(
          lk,
          (prev: Extra[]) => (prev || []).filter((e) => e.id !== item.id),
          true,
        );
        toast.success("Eliminado");
      } catch {
        toast.error("Error al eliminar ajuste");
      } finally {
        savingRef.current = false;
        setSavingKey(null);
      }
    },
    [locked, syncWithServer, setLocal],
  );

  // ---- Helpers for AdjustmentRow callbacks ----

  const pointsHandler = useCallback(
    (item: AdjustmentItem) => (v: number) => {
      void updateAdjustment(item, { puntos: v });
    },
    [updateAdjustment],
  );

  const motivoHandler = useCallback(
    (item: AdjustmentItem) => (v: string) => {
      void updateAdjustment(item, { motivo: v });
    },
    [updateAdjustment],
  );

  const deleteHandler = useCallback(
    (item: AdjustmentItem) => () => {
      void deleteAdjustment(item);
    },
    [deleteAdjustment],
  );

  const isItemSaving = useCallback(
    (item: AdjustmentItem) => savingKey === `update:${item.id}` || savingKey === `delete:${item.id}`,
    [savingKey],
  );

  // ---- Render helpers ----

  const renderAdjustmentList = (items: AdjustmentItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <AdjustmentRow
            key={item.id}
            item={item}
            saving={isItemSaving(item)}
            locked={locked}
            onUpdatePoints={pointsHandler(item)}
            onUpdateMotivo={motivoHandler(item)}
            onDelete={deleteHandler(item)}
          />
        ))}
      </div>
    );
  };

  // ---- Render ----

  return (
    <div className="space-y-8 pb-10">
      {/* -- Teams section -- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">
            Equipos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {activeTeams.map((t) => {
            const tItems = adjustments.filter((x) => x.team === t);
            const total = balance(tItems);

            return (
              <div
                key={t}
                className="rounded-2xl p-4 flex flex-col gap-3 border-2 transition-all relative shadow-sm"
                style={{
                  backgroundColor: getTeamBg(t),
                  borderColor: TEAM_COLORS[t] + "44",
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-inner"
                    style={{ backgroundColor: TEAM_COLORS[t] }}
                  >
                    {t}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black opacity-60 uppercase">
                      Puntos
                    </div>
                    <div
                      className="text-xl font-black"
                      style={{ color: TEAM_COLORS[t] }}
                    >
                      {total > 0 ? "+" : ""}
                      {total}
                    </div>
                  </div>
                </div>

                {/* Items */}
                {renderAdjustmentList(tItems)}

                {/* Quick actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => addAdjustment(null, t, "descuento")}
                    size="sm"
                    disabled={
                      locked ||
                      savingKey === addKey("descuento", null, t)
                    }
                    className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-red-700 font-black disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => addAdjustment(null, t, "extra")}
                    size="sm"
                    disabled={
                      locked || savingKey === addKey("extra", null, t)
                    }
                    className="flex-1 h-9 rounded-xl bg-white/50 hover:bg-white/80 border-none text-primary font-black disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -- Individuals section -- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Individuales
            </span>
          </div>
          <span className="text-[10px] font-bold text-text-muted">
            {filteredPlayers.length} personas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filteredPlayers.map((p) => {
            const pItems = adjustments.filter((x) => x.pid === p.id);
            const total = balance(pItems);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-3 flex items-start gap-3 border border-surface-dark shadow-sm"
              >
                <Avatar p={p} size={36} className="mt-1" />

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {p.nombre} {p.apellido}
                  </div>
                  <div className="text-[10px] font-black text-text-muted uppercase mb-1">
                    Balance:{" "}
                    <span
                      className={cn(
                        total > 0
                          ? "text-green-600"
                          : total < 0
                            ? "text-red-600"
                            : "",
                      )}
                    >
                      {total > 0 ? "+" : ""}
                      {total} pts
                    </span>
                  </div>

                  {renderAdjustmentList(pItems)}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    onClick={() => addAdjustment(p.id, null, "descuento")}
                    size="icon"
                    variant="ghost"
                    disabled={
                      locked ||
                      savingKey === addKey("descuento", p.id, null)
                    }
                    className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => addAdjustment(p.id, null, "extra")}
                    size="icon"
                    variant="ghost"
                    disabled={
                      locked || savingKey === addKey("extra", p.id, null)
                    }
                    className="h-9 w-9 bg-indigo-50 text-primary hover:bg-indigo-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
